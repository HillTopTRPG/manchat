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
import { forEach, merge } from 'lodash'
import { User } from '~/data/user'
import { Room } from '~/data/room'
import UserNavItem from '~/pages/Room/Components/UserNavItem.vue'
import UserListItem from '~/pages/Room/Components/UserListItem.vue'

const sessionStore = inject(sessionKey) as SessionStore

const props = defineProps<{
  room_uuid: string
  user_uuid?: string | undefined
  user_name?: string
  user_password?: string
  nav1?: string | 'room-info' | undefined
  nav2?: Nav | undefined
  rail?: string
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
  subscription_uuid: sessionStore.session_uuid.value,
}

const room  = ref<Room | null>(null)
const users = ref<User[]>([])

const collections = {
  room,
  users,
}

const userLoggedInFlg = ref(false)

const breadcrumbsItems = computed(() => {
  const user = userLoggedInFlg.value && users.value.find(u => u.uuid === selectedNav1.value[0])
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
    ] : [], nav2Text.value ? [
      {
        title   : nav2Text.value,
        disabled: false,
        href    : '',
      },
    ] : [],
  ].flatMap(a => a)
})

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

const drawerRail = ref<boolean | null>(parseInt(props.rail || '0') > 0)
watch(drawerRail, value => {
  if (!userLoggedInFlg.value || value === null) {
    return
  }
  const args = { rail: drawerRail.value ? '1' : '0' }
  toRoomUser(merge({}, env, props, args), true)
})

const selectedNav1      = ref<string[]>([props.nav1 || 'room-info'])
const nav1              = computed(() => selectedNav1.value[0])
sessionStore.nav1.value = nav1.value
const updateNav1        = (newList: string[]) => {
  selectedNav1.value.splice(0, selectedNav1.value.length, ...newList)
}
watch(nav1, (value) => {
  if (!userLoggedInFlg.value) {
    return
  }

  sessionStore.nav1.value = nav1.value
  const getNextNav        = (...list: Nav[]) => list.some(n => n === sessionStore.nav2.value) ? props.nav2 : undefined
  const roomNav           = getNextNav('room-basic')
  const userNav           = getNextNav('profile', 'notification')
  const otherUserNav      = getNextNav('profile')

  const nextNav = value === 'room-info' ? roomNav : value === props.user_uuid ? userNav : otherUserNav
  const args    = {
    nav1: nav1.value,
    nav2: nextNav,
    rail: drawerRail.value ? '1' : '0',
  }
  toRoomUser(merge({}, env, props, args), true)
  updateNav2([nextNav], true)
})

const selectedNav2 = ref<Nav[]>(['init'])
const nav2         = computed(() => selectedNav2.value[0])
watch(nav2, (value) => sessionStore.nav2.value = value)
const updateNav2 = (navs: (Nav | undefined)[], force?: boolean) => {
  const filtered = navs.filter((n): n is NonNullable<typeof n> => n !== undefined)
  selectedNav2.value.splice(0, selectedNav2.value.length, ...filtered)
  switch (nav2.value) {
    case 'profile':
    case 'notification':
    case 'room-basic':
      const args = {
        nav1: nav1.value,
        nav2: nav2.value,
        rail: drawerRail.value ? '1' : '0',
      }
      toRoomUser(merge({}, env, props, args), true)
      break
    default:
      if (force) {
        const args = {
          nav1: nav1.value,
          nav2: undefined,
          rail: drawerRail.value ? '1' : '0',
        }

        const payload: any = merge({}, env, { ...props })
        // mergeではundefinedに更新できない
        forEach(args, (v, k) => payload[k] = v)
        toRoomUser(payload, true)
      }
  }
}
switch (props.nav2) {
  case 'profile':
  case 'notification':
  case 'room-basic':
    updateNav2([props.nav2])
    break
  default:
    updateNav2(['init'])
    break
}
const nav2Text = computed(() => {
  switch (nav2.value) {
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

watch(() => props.user_uuid, (value) => {
  sessionStore.user_uuid.value = value
  props.nav1 === undefined && updateNav1([value || 'room-info'])
})

const logoutUser = async () => {
  updateNav1(['room-info'])
  sessionStore.user_uuid.value = undefined
  return toRoom(merge({}, env, props), false)
}

let isInitialLogin = false

const existsUserName = computed(() => users.value.find(u => u.uuid === sessionStore.user_uuid.value)?.name || '')

const successUserLoggedIn = (user_uuid: string) => {
  loginDialog.value     = false
  userLoggedInFlg.value = true
  props.nav1 === undefined && updateNav1([user_uuid])

  const next = {
    name  : 'room-user',
    params: {
      room_uuid: props.room_uuid,
      user_uuid,
    },
    query : {
      nav1: user_uuid,
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
  loginDialog.value            = true
  sessionStore.user_uuid.value = user_uuid
  loginAlertText.value         = ''
  loading.value                = false
  userName.value               = ''
  userPassword.value           = ''
}

const userLogin = async () => {
  if (loading.value) {
    return
  }
  loading.value = true

  const userLoginWrapResult = await requestUserLoginWrap(merge({}, env, props, {
    user_uuid    : sessionStore.user_uuid.value,
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
  //  updateNav1(['room-info'])

  if (roomChannel) {
    cable.subscriptions.remove(roomChannel)
  }

  if (usersChannel) {
    cable.subscriptions.remove(usersChannel)
  }

  const result = await requestTokenCheckWrap(merge({}, env, props, collections, {
    userLoggedInFlg,
    drawerRail,
    selectedNav1,
    selectedNav2,
  }))
  if (result !== null) {
    if (result === 'expire_user_token') {
      isInitialLogin               = true
      loginDialog.value            = true
      sessionStore.user_uuid.value = props.user_uuid
    }
    return
  }
  userSort(users)

  // ユーザー作成ダイアログを表示する
  if (!userLoggedInFlg.value && props.user_uuid === undefined && props.user_name !== undefined) {
    isInitialLogin               = true
    loginDialog.value            = true
    sessionStore.user_uuid.value = undefined
    userName.value               = props.user_name
    userPassword.value           = props.user_password || ''
    return
  }

  roomChannel                  = createRoomChannel(merge({}, env, props, collections))
  usersChannel                 = props.user_uuid ? createUserChannel(merge({}, env, props)) : null
  sessionStore.room_uuid.value = props.room_uuid
  sessionStore.user_uuid.value = props.user_uuid
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
  result.push(nav2.value)
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
        :icon='drawerRail ? "mdi-menu" : "mdi-backburger"'
      ></v-app-bar-nav-icon>
      <v-avatar image='https://quoridorn.com/img/mascot/normal/mascot_normal.png' class='ml-3' v-if='!collapse' />
      <v-toolbar-title>
        <v-breadcrumbs :items='breadcrumbsItems' v-if='room'>
          <template #divider>
            <v-icon>mdi-chevron-right</v-icon>
          </template>
        </v-breadcrumbs>
      </v-toolbar-title>
      <v-spacer v-if='collapse' />
      <v-btn
        variant='text'
        :icon='collapse ? "mdi-arrow-expand-right" : "mdi-arrow-collapse-left"'
        @click='collapse = !collapse'
        v-if='userLoggedInFlg'
      ></v-btn>
      <v-btn
        variant='text'
        icon='mdi-pencil-ruler'
        @click='showBar = !showBar'
        v-if='nav2 !== "init" && nav2 !== "entrance" && !(drawerRail && collapse)'
      ></v-btn>
      <v-btn variant='text' icon='mdi-brightness-6' @click='toggleTheme' v-if='!(drawerRail && collapse)'></v-btn>
    </v-app-bar>

    <v-navigation-drawer :rail='drawerRail || userLoggedInFlg' rail-width='70' :permanent='true'>
      <v-list
        :nav='true'
        :mandatory='true'
        :selected='readonly(selectedNav1)'
        @update:selected='updateNav1'
      >
        <template v-if='userLoggedInFlg'>
          <user-nav-item
            label='部屋'
            :show-label='!drawerRail'
            value='room-info'
            append-icon='home'
            tooltip-text='部屋'
            :big-icon='true'
          />
          <user-list-item :user='users.find(u => u.uuid === user_uuid)' :hide-title='drawerRail' />
          <v-divider class='my-2' />
        </template>
        <template v-else>
          <v-list-subheader v-if='!drawerRail'>ログイン</v-list-subheader>
        </template>

        <user-nav-item
          label='新しいユーザー'
          :show-label='!drawerRail'
          value='new-user'
          prepend-icon='login-variant'
          tooltip-text='新しいユーザーを作成します'
          @click-list-item='showUserLogin()'
          :big-icon='true'
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
      v-if='userLoggedInFlg && nav2 !== "init"'
    >
      <v-list
        :nav='true'
        :selected='readonly(selectedNav2)'
        @update:selected='list => updateNav2(list, true)'
        density='compact'
      >
        <template v-if='nav1 === "room-info"'>
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
          <template v-if='nav1 === user_uuid'>
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
          :nav1='nav1'
          :nav2='nav2'
          :users='users'
          :room='room'
          :showBar='showBar'
          @requireUserLogin='showUserLogin'
          @logoutUser='logoutUser()'
          @close-overlay='updateNav2([], true)'
        />
      </suspense>
    </v-main>
  </v-layout>

  <v-dialog :model-value='loginDialog'>
    <v-card class='mx-auto mt-5 pa-3' :loading='loading'>
      <v-card-title v-text='sessionStore.user_uuid !== undefined ? existsUserName : "新しいユーザー"' />
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
          :autofocus='sessionStore.user_uuid === undefined'
          @keydown.esc='loginDialog = false'
          @keydown.enter='userPasswordInput.focus()'
          v-if='sessionStore.user_uuid === undefined'
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
          :autofocus='sessionStore.user_uuid !== undefined'
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
            :disabled='loading || (sessionStore.user_uuid === undefined && (!userName || users.some(u => u.name === userName)))'
            :append-icon='sessionStore.user_uuid === undefined ? "mdi-account-plus" : "mdi-login"'
          >{{ sessionStore.user_uuid === undefined ? '新規登録' : 'ログイン' }}
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
.v-main {
  height: 100vh;
}

.v-toolbar {
  min-width: 325px;
}

.drawer-rail .v-toolbar {
  min-width: 124px;
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
  height: 100% !important;
}

.v-navigation-drawer .v-list-item {
  overflow: hidden;
}

.v-toolbar--collapse {
  border-bottom-right-radius: 16px !important;
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

.chat-overlay,
.chat-overlay * {
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
