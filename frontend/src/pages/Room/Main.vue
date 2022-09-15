<script setup lang='ts'>
import { computed, inject, onBeforeUnmount, readonly, ref, watch } from 'vue'
import Contents from '~/pages/Room/Contents.vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import UserIcon from '~/pages/Room/UserIcon.vue'
import {
  createRoomChannel,
  createUserChannel,
  Nav,
  requestTokenCheckWrap,
  requestUserLoginWrap,
  requestUserTokenCheck,
  toPlay,
  toRoom,
  userSort,
} from '~/pages/AccountHelper'

import { InjectionKeySymbol as sessionKey, StoreType as SessionStore } from '~/data/session'
import { merge, omit } from 'lodash'
import { User } from '~/data/user'
import { Room } from '~/data/room'

const sessionState = inject(sessionKey) as SessionStore

const props = defineProps<{
  room_uuid: string
  user_uuid?: string
  user_name?: string
  user_password?: string
  auto_play?: string
}>()

const theme             = useTheme()
theme.global.name.value = localStorage.getItem('view.theme') || 'light'
const toggleTheme       = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  localStorage.setItem('view.theme', theme.global.name.value)
}

const router = useRouter()
const axios  = inject('axios') as any
const cable  = inject('cable') as any

const env = {
  router,
  axios,
  cable,
  subscription_uuid: sessionState.state.session_uuid,
}

const drawerRail = ref(true)
const contentRef = ref()
const roomData   = ref<Room | null>(null)
const users      = ref<User[]>([])

const breadcrumbsItems = computed(() => (
  [
    {
      title   : `#${roomData.value?.id} ${roomData.value?.name}`,
      disabled: false,
      href    : '',
    }, {
    title   : users.value.find(u => u.uuid === props.user_uuid)?.name,
    disabled: false,
    href    : '',
  },
  ]
))

const userUuid          = ref<string | undefined>(undefined)
const loginDialog       = ref(false)
const userName          = ref('')
const userPassword      = ref('')
const userShowPassword  = ref(false)
const loading           = ref(false)
const loginAlertType    = ref('error')
const loginAlertIcon    = ref('$info')
const loginAlertText    = ref('')
const userPasswordInput = ref<HTMLInputElement>()
const userNameInput     = ref<HTMLInputElement>()

const selectedUserUuid       = ref<string[]>([])
const updateSelectedUserUuid = (newList: string[]) => {
  selectedUserUuid.value.splice(0, selectedUserUuid.value.length, ...newList)
}

const selectedNav       = ref<Nav[]>(['entrance'])
const currentNav        = computed(() => selectedNav.value[0])
const updateSelectedNav = (newList: Nav[]) => {
  selectedNav.value.splice(0, selectedNav.value.length, ...newList)
}

watch(() => props.user_uuid, () => {
  if (props.user_uuid) {
    selectedUserUuid.value.splice(0, selectedUserUuid.value.length, props.user_uuid)
  }
})

const gotoLobby = () => router.push({ name: 'lobby' })

const logout = async () => {
  selectedUserUuid.value.splice(0, selectedUserUuid.value.length)
  userUuid.value = undefined
  return toRoom(merge({}, env, props), false)
}

let isInitialLogin = false

const existsUserName  = computed(() => users.value.find(u => u.uuid === userUuid.value)?.name || '')
const userLoggedInFlg = ref(false)

const successUserLoggedIn = (user_uuid: string) => {
  loginDialog.value     = false
  userLoggedInFlg.value = true
  drawerRail.value      = false
  selectedUserUuid.value.splice(0, selectedUserUuid.value.length, user_uuid)

  const next = {
    name  : props.auto_play ? 'play' : 'room-user',
    params: {
      room_uuid: props.room_uuid,
      user_uuid,
    },
  }
  if (isInitialLogin) {
    return router.replace(next)
  } else {
    return router.push(next)
  }
}

const preUserLogin = async (user_uuid?: string) => {
  const data = await requestUserTokenCheck(merge({}, env, props, { user_uuid }))
  if (data?.verify === 'success') {
    successUserLoggedIn(user_uuid!).then()
  }
  return data?.verify === 'success'
}

const showUserLogin = async (user_uuid?: string) => {
  isInitialLogin = false

  if (await preUserLogin(user_uuid)) {
    return
  }
  loginDialog.value    = true
  userUuid.value       = user_uuid
  loginAlertText.value = ''
  loading.value        = false
  userName.value       = ''
  userPassword.value   = ''
}

const userLogin = async () => {
  if (loading.value) {
    return
  }
  loading.value = true

  const userLoginWrapResult = await requestUserLoginWrap(merge({}, env, props, {
    user_uuid    : userUuid.value,
    user_name    : userName.value,
    user_password: userPassword.value,
    loginAlertType,
    loginAlertText,
    userNameInput,
    userPasswordInput,
  }))

  loading.value = false

  // ログインできずエラーメッセージ表示または画面遷移の処理済み
  if (userLoginWrapResult === null) {
    return
  }

  successUserLoggedIn(userLoginWrapResult.user_uuid).then()
}

const gotoPlay = () => toPlay(merge({}, env, props))

const loginDialogCancel = () => {
  loginDialog.value = false
  if (!userLoggedInFlg.value) {
    toRoom(merge({}, env, props), false).then()
  }
}

const roomChannel = createRoomChannel(merge({}, env, props, { users }))

let usersChannel: any = null

onBeforeUnmount(() => {
  cable.subscriptions.remove(roomChannel)
  if (usersChannel) {
    cable.subscriptions.remove(usersChannel)
  }
})

const initialize = async () => {
  userLoggedInFlg.value = false
  selectedUserUuid.value.splice(0, selectedUserUuid.value.length)
  drawerRail.value = !!props.user_uuid

  if (usersChannel) {
    cable.subscriptions.remove(usersChannel)
  }

  console.log(JSON.stringify(props, null, '  '))
  console.log(JSON.stringify(omit(env, 'router', 'axios', 'cable'), null, '  '))
  const result = await requestTokenCheckWrap(merge({}, env, props, {
    roomData,
    users,
    userLoggedInFlg,
    drawerRail,
    selectedUserUuid,
    selectedNav,
  }))
  console.log(JSON.stringify(result, null, '  '))
  if (result !== null) {
    if (result === 'expire_user_token') {
      isInitialLogin    = true
      loginDialog.value = true
      userUuid.value    = props.user_uuid
    }
    return
  }
  userSort(users)

  // ユーザー作成ダイアログを表示する
  if (!userLoggedInFlg.value && props.user_uuid === undefined && props.user_name !== undefined) {
    isInitialLogin     = true
    loginDialog.value  = true
    userUuid.value     = undefined
    userName.value     = props.user_name
    userPassword.value = props.user_password || ''
  }

  usersChannel = props.user_uuid ? createUserChannel(merge({}, env, props)) : null
}
initialize().then()
watch([() => props.room_uuid, () => props.user_uuid], initialize)
</script>

<template>
  <v-layout>
    <v-app-bar prominent elevation='1' density='compact'>
      <v-app-bar-nav-icon
        variant='text' @click.stop='drawerRail = !drawerRail'
        :icon='drawerRail ? "mdi-chevron-right" : "mdi-chevron-left"'
      ></v-app-bar-nav-icon>
      <v-avatar image='https://quoridorn.com/img/mascot/normal/mascot_normal.png' class='ml-3' />
      <v-toolbar-title>
        <v-breadcrumbs :items='breadcrumbsItems' v-if='roomData'>
          <template #divider>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
        </v-breadcrumbs>
      </v-toolbar-title>
      <v-spacer />
      <v-btn variant='text' icon='mdi-brightness-6' @click='toggleTheme'></v-btn>
    </v-app-bar>

    <v-navigation-drawer :rail='drawerRail || userLoggedInFlg' rail-width='80' :permanent='true'>
      <v-list
        :nav='true'
        :mandatory='true'
        :selected='readonly(selectedUserUuid)'
        @update:selected='updateSelectedUserUuid'
      >
        <v-tooltip transition='scale-transition'>
          <template #activator='{ props }'>
            <v-list-item @click='gotoLobby' variant='outlined' v-bind='props'>
              <template #append>
                <v-icon size='x-large' class='mr-2'>mdi-home-group</v-icon>
              </template>
              <transition name='fade'>
                <v-list-item-title class='pl-7' v-if='!drawerRail'>ロビー</v-list-item-title>
              </transition>
            </v-list-item>
          </template>
          <span class='font-weight-bold'>ロビーに戻ります。</span>
        </v-tooltip>

        <v-divider />

        <template v-if='userLoggedInFlg'>
          <v-list-subheader v-if='user_uuid'>あなた</v-list-subheader>

          <v-tooltip transition='scale-transition'>
            <template #activator='{ props }'>
              <v-list-item
                class='py-2'
                :value='users.find(u => u.uuid === user_uuid)?.uuid'
                active-color='primary'
                variant='elevated'
                v-bind='props'
              >
                <template #prepend>
                  <user-icon :user='users.find(u => u.uuid === user_uuid)' />
                </template>
                <transition name='fade'>
                  <v-list-item-title class='pl-7' v-if='!drawerRail'>{{
                      users.find(u => u.uuid === user_uuid)?.name || ''
                    }}
                  </v-list-item-title>
                </transition>
              </v-list-item>
            </template>
            <span class='font-weight-bold'>{{ users.find(u => u.uuid === user_uuid)?.name || '' }}</span>
          </v-tooltip>
        </template>

        <v-list-subheader v-if='user_uuid'>{{ drawerRail || userLoggedInFlg ? 'Users' : '他のユーザー' }}</v-list-subheader>
        <v-list-subheader v-else>{{ drawerRail ? 'Log in' : 'ログイン' }}</v-list-subheader>

        <v-tooltip transition='scale-transition' v-if='!user_uuid'>
          <template #activator='{ props }'>
            <v-list-item @click='showUserLogin()' v-bind='props'>
              <template #prepend>
                <v-icon size='x-large' class='mr-2'>mdi-login-variant</v-icon>
              </template>
              <transition name='fade'>
                <v-list-item-title class='pl-7' v-if='!drawerRail'>新しいユーザー</v-list-item-title>
              </transition>
            </v-list-item>
          </template>
          <span class='font-weight-bold'>新しいユーザーを作成します</span>
        </v-tooltip>

        <template v-for='user in users' :key='user.uuid'>
          <v-tooltip transition='scale-transition' v-if='!userLoggedInFlg || user.uuid !== user_uuid'>
            <template #activator='{ props }'>
              <v-list-item
                :value='user.uuid'
                @click='!userLoggedInFlg && showUserLogin(user.uuid)'
                active-color='primary'
                variant='elevated'
                class='py-2'
                v-bind='props'
              >
                <template #prepend>
                  <user-icon :user='user' />
                </template>
                <transition name='fade'>
                  <v-list-item-title class='pl-7' v-if='!drawerRail'>{{ user.name }}</v-list-item-title>
                </transition>
              </v-list-item>
            </template>
            <span class='font-weight-bold'>{{ user.name }}</span>
          </v-tooltip>
        </template>
      </v-list>
    </v-navigation-drawer>


    <v-navigation-drawer
      :rail='drawerRail'
      rail-width='80'
      :permanent='true'
      v-if='userLoggedInFlg && currentNav !== "init"'
    >
      <v-list
        :nav='true'
        :mandatory='true'
        :selected='readonly(selectedNav)'
        @update:selected='updateSelectedNav'
      >
        <v-tooltip transition='scale-transition'>
          <template #activator='{ props }'>
            <v-list-item variant='elevated' color='primary' value='profile' v-bind='props'>
              <template #append>
                <v-icon size='x-large' class='mr-2'>mdi-badge-account</v-icon>
              </template>
              <transition name='fade'>
                <v-list-item-title class='pl-7' v-if='!drawerRail'>プロフィール</v-list-item-title>
              </transition>
            </v-list-item>
          </template>
          <span class='font-weight-bold'>プロフィールを表示・編集します。</span>
        </v-tooltip>

        <v-tooltip transition='scale-transition'>
          <template #activator='{ props }'>
            <v-list-item variant='elevated' color='primary' value='room-info' v-bind='props'>
              <template #append>
                <v-icon size='x-large' class='mr-2'>mdi-table-furniture</v-icon>
              </template>
              <transition name='fade'>
                <v-list-item-title class='pl-7' v-if='!drawerRail'>卓情報</v-list-item-title>
              </transition>
            </v-list-item>
          </template>
          <span class='font-weight-bold'>卓情報を表示・編集します。</span>
        </v-tooltip>
      </v-list>

      <v-spacer />

      <v-list :nav='true'>
        <v-tooltip transition='scale-transition'>
          <template #activator='{ props }'>
            <v-list-item @click='gotoPlay()' variant='outlined' color='primary' v-bind='props'>
              <template #append>
                <v-icon size='x-large' class='mr-2'>mdi-dice-multiple</v-icon>
              </template>
              <transition name='fade'>
                <v-list-item-title class='pl-7' v-if='!drawerRail'>プレイ</v-list-item-title>
              </transition>
            </v-list-item>
          </template>
          <span class='font-weight-bold'>プレイ画面に移動します。</span>
        </v-tooltip>

        <v-tooltip transition='scale-transition'>
          <template #activator='{ props }'>
            <v-list-item @click='logout()' variant='outlined' v-bind='props'>
              <template #append>
                <v-icon size='x-large' class='mr-2'>mdi-logout-variant</v-icon>
              </template>
              <transition name='fade'>
                <v-list-item-title class='pl-7' v-if='!drawerRail'>ログアウト</v-list-item-title>
              </transition>
            </v-list-item>
          </template>
          <span class='font-weight-bold'>ログアウトし、部屋に戻ります。</span>
        </v-tooltip>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <suspense>
        <Contents
          :room_uuid='room_uuid'
          :user_uuid='user_uuid'
          :user_name='user_name'
          :user_password='user_password'
          :auto_play='auto_play'
          :users='users'
          :nav='currentNav'
          @requireUserLogin='showUserLogin'
          ref='contentRef'
        />
      </suspense>
    </v-main>
  </v-layout>

  <v-dialog :model-value='loginDialog'>
    <v-card class='mx-auto mt-5 pa-3' :loading='loading'>
      <v-card-title v-text='userUuid !== undefined ? existsUserName : "新しいユーザー"' />
      <v-card-subtitle>ログイン</v-card-subtitle>
      <v-card-text>
        <v-alert
          colored-border
          :type='loginAlertType'
          elevation='2'
          :icon='loginAlertIcon'
          density='compact'
          class='mb-5'
          :text='loginAlertText'
          v-if='loginAlertText'
        ></v-alert>
        <!--suppress JSUnresolvedFunction, PointlessBooleanExpressionJS -->
        <v-text-field
          v-model='userName'
          append-icon='empty'
          :autofocus='userUuid === undefined'
          @keydown.esc='loginDialog = false'
          @keydown.enter='userPasswordInput.focus()'
          v-if='userUuid === undefined'
          ref='userNameInput'
        >
          <template #label>
            <v-icon>mdi-account-circle</v-icon>
            ユーザー名
          </template>
        </v-text-field>
        <v-text-field
          :append-icon='userShowPassword ? "mdi-eye" : "mdi-eye-off"'
          :type='userShowPassword ? "text" : "password"'
          v-model='userPassword'
          @click:append='userShowPassword = !userShowPassword'
          @keydown.enter='userLogin'
          @keydown.esc='loginDialog = false'
          :autofocus='userUuid !== undefined'
          ref='userPasswordInput'
        >
          <template #label>
            <v-icon>mdi-lock</v-icon>
            パスワード
          </template>
        </v-text-field>
        <v-card-actions>
          <v-btn
            color='primary'
            variant='flat'
            @click='userLogin'
            :loading='loading'
            :disabled='loading || (userUuid === undefined && (!userName || users.some(u => u.name === userName)))'
            :append-icon='userUuid === undefined ? "mdi-account-plus" : "mdi-login"'
          >{{ userUuid === undefined ? '新規登録' : 'ログイン' }}
          </v-btn>
          <v-btn color='secondary' variant='flat' @click='loginDialogCancel()'>キャンセル</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<!--suppress HtmlUnknownAttribute, CssUnusedSymbol -->
<style deep lang='css'>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.v-navigation-drawer__content {
  display: flex;
  flex-direction: column;
}

.v-navigation-drawer--rail .v-list-item__append > * {
  margin-left: 0;
}

.v-navigation-drawer .v-list-item {
  overflow: hidden;
}

/*noinspection CssUnresolvedCustomProperty*/
.v-tooltip .v-overlay__content {
  background: rgba(var(--v-theme-surface-variant), 0.9);
  color: rgb(var(--v-theme-on-surface-variant));
}

.v-tooltip .v-overlay__content * {
  background: transparent !important;
}
</style>
