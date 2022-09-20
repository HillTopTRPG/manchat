<script setup lang='ts'>
import { computed, inject, onBeforeUnmount, readonly, ref, watch } from 'vue'
import Contents from '~/pages/Room/Contents.vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import {
  createRoomChannel,
  createUserChannel,
  Nav,
  requestTokenCheckWrap,
  requestUserLoginWrap,
  requestUserTokenCheck,
  toRoom,
  toRoomUser,
  userSort,
} from '~/pages/AccountHelper'

import { InjectionKeySymbol as sessionKey, StoreType as SessionStore } from '~/data/session'
import { merge } from 'lodash'
import { User } from '~/data/user'
import { Room } from '~/data/room'
import UserNavItem from '~/pages/Room/Components/UserNavItem.vue'
import UserListItem from '~/pages/Room/Components/UserListItem.vue'

const sessionState = inject(sessionKey) as SessionStore

const props = defineProps<{
  room_uuid: string
  user_uuid?: string
  user_name?: string
  user_password?: string
  open?: Nav
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
const room       = ref<Room | null>(null)
const users      = ref<User[]>([])

const collections = {
  room,
  users,
}

const breadcrumbsItems = computed(() => {
  const user = userLoggedInFlg.value && users.value.find(u => u.uuid === selectedUserUuid.value[0])
  return [
    [
      {
        title   : `#${room.value?.id} ${room.value?.name}`,
        disabled: false,
        href    : '',
      },
    ], user ? [
      {
        title   : user.name,
        disabled: false,
        href    : '',
      },
    ] : [], currentNavText.value ? [
      {
        title   : currentNavText.value,
        disabled: false,
        href    : '',
      },
    ] : [],
  ].flatMap(a => a)
})

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

const selectedUserUuid       = ref<string[]>(['room-info'])
const currentUserUuid        = computed(() => selectedUserUuid.value[0])
const updateSelectedUserUuid = (newList: string[]) => {
  selectedUserUuid.value.splice(0, selectedUserUuid.value.length, ...newList)
}
watch(currentUserUuid, (value) => {
  if (!userLoggedInFlg.value) {
    return
  }
  const userNav: Nav | undefined = value === props.user_uuid ? props.open : 'profile'
  const nextNav                  = value === 'room-info' ? 'room-basic' : userNav
  if (nextNav) {
    selectedNav.value.splice(0, selectedNav.value.length, nextNav)
  } else {
    selectedNav.value.splice(0, selectedNav.value.length)
  }
})

const selectedNav = ref<Nav[]>(['init'])
switch (props.open) {
  case 'profile':
  case 'notification':
  case 'room-basic':
    selectedNav.value[0] = props.open
    break
  default:
    selectedNav.value[0] = 'init'
    break
}
const currentNav = computed(() => selectedNav.value[0])
watch(currentNav, () => {
  console.log(currentNav.value)
  switch (currentNav.value) {
    case 'profile':
    case 'notification':
    case 'room-basic':
      toRoomUser(merge({}, env, props, { open: currentNav.value }), true)
      break
    default:
  }
})
const currentNavText    = computed(() => {
  switch (currentNav.value) {
    case 'profile':
      return 'プロフィール'
    case 'entrance':
      return 'エントランス'
    case 'room-basic':
      return '基本情報'
    case 'notification':
      return '通知設定'
  }
  return ''
})
const updateSelectedNav = (newList: Nav[]) => {
  selectedNav.value.splice(0, selectedNav.value.length, ...newList)
}

watch(() => props.user_uuid, () => {
  selectedUserUuid.value.splice(0, selectedUserUuid.value.length, props.user_uuid || 'room-info')
})

const logoutUser = async () => {
  selectedUserUuid.value.splice(0, selectedUserUuid.value.length, 'room-info')
  userUuid.value = undefined
  return toRoom(merge({}, env, props), false)
}

const closeOverlay = () => {
  selectedNav.value.splice(0, selectedNav.value.length)
  const args = merge({}, env, { ...props })
  args.open  = undefined
  toRoomUser(args, true)
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
    name  : 'room-user',
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

const loginDialogCancel = () => {
  loginDialog.value = false
  if (!userLoggedInFlg.value) {
    toRoom(merge({}, env, props), false).then()
  }
}

let roomChannel: any  = null
let usersChannel: any = null

onBeforeUnmount(() => {
  if (roomChannel) {
    cable.subscriptions.remove(roomChannel)
  }
  if (usersChannel) {
    cable.subscriptions.remove(usersChannel)
  }
})

const initialize = async () => {
  userLoggedInFlg.value = false
  selectedUserUuid.value.splice(0, selectedUserUuid.value.length, 'room-info')
  drawerRail.value = !!props.user_uuid

  if (roomChannel) {
    cable.subscriptions.remove(roomChannel)
  }

  if (usersChannel) {
    cable.subscriptions.remove(usersChannel)
  }

  const result = await requestTokenCheckWrap(merge({}, env, props, collections, {
    userLoggedInFlg,
    drawerRail,
    selectedUserUuid,
    selectedNav,
  }))
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

  roomChannel  = createRoomChannel(merge({}, env, props, collections))
  usersChannel = props.user_uuid ? createUserChannel(merge({}, env, props)) : null
}
initialize().then()
watch([() => props.room_uuid, () => props.user_uuid], initialize)

const collapse  = ref(false)
const showBar   = ref(false)
const rootClass = computed(() => {
  const result = []
  if (collapse.value) {
    result.push('toolbar-collapse')
  }
  result.push(currentNav.value)
  if (drawerRail.value) {
    result.push('drawer-rail')
  }
  return result
})
</script>

<template>
  <v-layout :class='rootClass'>
    <v-app-bar prominent elevation='1' density='compact' :collapse='collapse'>
      <v-app-bar-nav-icon
        variant='text' @click.stop='drawerRail = !drawerRail'
        :icon='drawerRail ? "mdi-chevron-right" : "mdi-chevron-left"'
      ></v-app-bar-nav-icon>
      <v-avatar image='https://quoridorn.com/img/mascot/normal/mascot_normal.png' class='ml-3' v-if='!collapse' />
      <v-toolbar-title>
        <v-breadcrumbs :items='breadcrumbsItems' v-if='room'>
          <template #divider>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
        </v-breadcrumbs>
      </v-toolbar-title>
      <v-btn
        variant='text'
        :icon='collapse ? "mdi-arrow-expand-horizontal" : "mdi-arrow-collapse-horizontal"'
        @click='collapse = !collapse'
      ></v-btn>
      <v-btn
        variant='text'
        icon='mdi-pencil-ruler'
        @click='showBar = !showBar'
        v-if='currentNav !== "init" && currentNav !== "entrance" && !(drawerRail && collapse)'
      ></v-btn>
      <v-btn variant='text' icon='mdi-brightness-6' @click='toggleTheme' v-if='!(drawerRail && collapse)'></v-btn>
    </v-app-bar>

    <v-navigation-drawer :rail='drawerRail || userLoggedInFlg' rail-width='80' :permanent='true'>
      <v-list
        :nav='true'
        :mandatory='true'
        :selected='readonly(selectedUserUuid)'
        @update:selected='updateSelectedUserUuid'
      >
        <user-nav-item
          label='部屋'
          :show-label='!drawerRail'
          value='room-info'
          append-icon='folder-home'
          tooltip-text='部屋'
          :big-icon='true'
        />

        <template v-if='userLoggedInFlg'>
          <v-list-subheader v-if='user_uuid'>あなた</v-list-subheader>
          <user-list-item :user='users.find(u => u.uuid === user_uuid)' :hide-title='drawerRail' />
        </template>

        <v-list-subheader v-if='user_uuid'>{{ drawerRail || userLoggedInFlg ? 'Users' : '他のユーザー' }}</v-list-subheader>
        <v-list-subheader v-else>{{ drawerRail ? 'Log in' : 'ログイン' }}</v-list-subheader>

        <user-nav-item
          label='新しいユーザー'
          :show-label='!drawerRail'
          value='new-user'
          prepend-icon='login-variant'
          tooltip-text='新しいユーザーを作成します'
          @click-list-item='showUserLogin()'
          v-if='!user_uuid'
        />

        <template v-for='user in users' :key='user.uuid'>
          <user-list-item
            :user='user'
            :hide-title='drawerRail'
            @click-list-item='!userLoggedInFlg && showUserLogin(user.uuid)'
            v-if='!userLoggedInFlg || user.uuid !== user_uuid'
          />
        </template>
      </v-list>
    </v-navigation-drawer>


    <v-navigation-drawer
      :rail='drawerRail'
      rail-width='54'
      :permanent='true'
      v-if='userLoggedInFlg && currentNav !== "init"'
    >
      <v-list :nav='true' :selected='readonly(selectedNav)' @update:selected='updateSelectedNav' density='compact'>
        <template v-if='currentUserUuid === "room-info"'>
          <user-nav-item
            label='基本情報'
            :show-label='!drawerRail'
            value='room-basic'
            append-icon='book-open-variant'
            tooltip-text='部屋の基本情報を表示・編集します。'
          />
        </template>
        <template v-else>
          <user-nav-item
            label='プロフィール'
            :show-label='!drawerRail'
            value='profile'
            append-icon='badge-account'
            tooltip-text='プロフィールを表示・編集します。'
          />
          <template v-if='currentUserUuid === user_uuid'>
            <v-list-subheader v-if='!drawerRail'>アプリの設定</v-list-subheader>
            <v-divider v-else />
            <user-nav-item
              label='通知'
              :show-label='!drawerRail'
              value='notification'
              append-icon='bell'
              tooltip-text='通知設定を表示・編集します。'
            />
          </template>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <suspense>
        <Contents
          :room_uuid='room_uuid'
          :user_uuid='user_uuid'
          :user_name='user_name'
          :user_password='user_password'
          :users='users'
          :room='room'
          :nav='currentNav'
          :showBar='showBar'
          @requireUserLogin='showUserLogin'
          @logoutUser='logoutUser()'
          @close-overlay='closeOverlay()'
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
  <v-overlay class='chat-overlay' scroll-strategy='none' :model-value='true'>
    <div>こんにちはーー！！！！</div>
  </v-overlay>
</template>

<!--suppress HtmlUnknownAttribute, CssUnusedSymbol, CssUnknownProperty -->

<style deep lang='css'>
.v-toolbar {
  min-width: 220px;
}

.drawer-rail .v-toolbar {
  min-width: 133px;
}

/*noinspection CssUnresolvedCustomProperty*/
.toolbar-collapse .v-main {
  padding-top: 0 !important;
}

.v-navigation-drawer__content {
  display: flex;
  flex-direction: column;
}

.v-navigation-drawer--rail .v-list-item__append > * {
  margin-left: 0;
}

.v-navigation-drawer {
  padding-top: 48px;
  margin-top: 0 !important;
}

.v-navigation-drawer .v-list-item {
  overflow: hidden;
}

/*noinspection CssUnresolvedCustomProperty*/
.v-tooltip .v-overlay__content {
  background: rgba(var(--v-theme-surface-variant), 0.9);
  color: rgb(var(--v-theme-on-surface-variant));
}

.v-tooltip .v-overlay__content > .v-card > * {
  padding: 0;
}

.v-tooltip .v-overlay__content * {
  background: transparent !important;
  color: inherit;
}

.chat-overlay > * {
  pointer-events: none;
}

/*noinspection CssUnresolvedCustomProperty*/
.chat-overlay .v-overlay__content > * {
  pointer-events: none;
  animation: loop 10s -25s linear infinite;
  position: absolute;
  top: 20px;
  font-size: 30px;
  white-space: pre;
  font-weight: bold;
  color: rgb(var(--v-theme-on-surface-variant));
  text-stroke: 1px rgb(var(--v-theme-surface-variant));
  -webkit-text-stroke: 1px rgb(var(--v-theme-surface-variant));
}

.chat-overlay .v-overlay__scrim {
  background: transparent;
}

@keyframes loop {
  0% {
    left: 100vw;
  }
  to {
    left: 0;
    transform: translateX(-100%);
  }
}

.v-list-item:hover > .v-list-item__overlay {
  opacity: calc(0.08 * var(--v-theme-overlay-multiplier));
}
</style>
