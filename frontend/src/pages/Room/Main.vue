<script setup lang='ts'>
import { computed, inject, onBeforeUnmount, readonly, ref, watch } from 'vue'
import Contents from '~/pages/Room/Contents.vue'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import UserIcon from '~/pages/Room/UserIcon.vue'

import { InjectionKeySymbol as sessionKey, StoreType as SessionStore } from '~/data/session'

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

const axios = inject('axios') as any
const cable = inject('cable') as any

const drawer     = ref(false)
const drawer2    = ref(true)
const contentRef = ref()
const roomData   = ref<{ id: number; uuid: string; name: string } | null>(null)
const users      = ref<{
  id: number
  uuid: string
  name: string
  user_type: string
  room_uuid: string
  log_in_count: number
  last_logged_in: Date
  created_at: Date
  updated_at: Date
}[]>([])

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
const ready             = ref(false)

const selectedUser       = ref<string[]>([])
const updateSelectedUser = (newList: string[]) => {
  selectedUser.value.splice(0, selectedUser.value.length, ...newList)
}

watch(() => props.user_uuid, () => {
  if (props.user_uuid) {
    selectedUser.value.splice(0, selectedUser.value.length, props.user_uuid)
  }
})

const gotoLobby = () => router.push({ name: 'lobby' })

const logout = async () => {
  selectedUser.value.splice(0, selectedUser.value.length)
  return router.push({
                       name  : 'room',
                       params: { room_uuid: props.room_uuid },
                     })
}

let isInitialLogin = false

const existsUserName  = computed(() => users.value.find(u => u.uuid === userUuid.value)?.name || '')
const userLoggedInFlg = ref(false)

const preUserLogin = async (user_uuid?: string) => {
  if (user_uuid === undefined) {
    return false
  }
  const { user_token } = JSON.parse(localStorage.getItem(user_uuid || '') || '{}')
  console.log({ user_token })
  if (user_token) {
    const { room_token } = JSON.parse(localStorage.getItem(props.room_uuid) || '{}')
    const { data }       = await axios.post(`/api/v1/users/${user_uuid}/token/${user_token}/check`, {
      room_uuid        : props.room_uuid,
      room_token,
      subscription_uuid: sessionState.state.session_uuid,
    })
    console.log(JSON.stringify(data, null, '  '))
    if (data.verify === 'success') {
      const name            = props.auto_play ? 'play' : 'room-user'
      const params          = {
        room_uuid: props.room_uuid,
        user_uuid,
      }
      userLoggedInFlg.value = true
      loginDialog.value     = false
      if (isInitialLogin) {
        router.replace({
                         name,
                         params,
                       }).then()
      } else {
        router.push({
                      name,
                      params,
                    }).then()
      }
      return true
    }
  }
  return false
}

const showUserLogin = async (initialLogin: boolean, user_uuid?: string) => {
  isInitialLogin = initialLogin
  if (await preUserLogin(user_uuid)) {
    return true
  }
  loginDialog.value    = true
  userUuid.value       = user_uuid
  loginAlertText.value = ''
  loading.value        = false
  userName.value       = ''
  userPassword.value   = ''
  return false
}

const userLogin = async () => {
  loginAlertText.value = ''
  const { room_token } = JSON.parse(localStorage.getItem(props.room_uuid) || '{}')

  const toLobbyQuery = {
    r        : props.room_uuid,
    u        : userUuid.value,
    auto_play: props.auto_play,
  }
  if (room_token === undefined) {
    return router.replace({
                            name : 'lobby',
                            query: toLobbyQuery,
                          })
  }

  let user_uuid,
      user_token
  if (userUuid.value !== undefined) {
    loading.value        = true
    loginAlertType.value = 'info'
    loginAlertText.value = 'ログイン中'
    const { data }       = await axios.post(`/api/v1/users/${userUuid.value}/login`, {
      password         : userPassword.value,
      room_uuid        : props.room_uuid,
      room_token,
      subscription_uuid: sessionState.state.session_uuid,
    })
    console.log(JSON.stringify(data, null, '  '))
    if (data.verify !== 'success') {
      loading.value = false
      if (data.reason === 'expire_room_token') {
        return router.replace({
                                name : 'lobby',
                                query: toLobbyQuery,
                              })
      }
      if (data.reason === 'invalid_password') {
        loginAlertType.value = 'error'
        loginAlertText.value = 'ユーザーパスワードが違います'
        userPasswordInput.value?.select()
      }
      return
    }
    user_uuid  = userUuid.value
    user_token = data.user_token
  } else {
    if (!userName.value) {
      loginAlertType.value = 'warning'
      loginAlertText.value = 'ユーザー名を入力してください。'
      return
    }
    if (users.value.some(u => u.name === userName.value)) {
      loginAlertType.value = 'warning'
      loginAlertText.value = '名前が重複しています。'
      return
    }
    loading.value        = true
    loginAlertType.value = 'info'
    loginAlertText.value = 'ログイン中'
    const { data }       = await axios.post(`/api/v1/users`, {
      api_v1_user      : {
        name     : userName.value,
        password : userPassword.value,
        room_uuid: props.room_uuid,
      },
      room_token,
      subscription_uuid: sessionState.state.session_uuid,
    })
    console.log(JSON.stringify(data, null, '  '))
    if (data.verify !== 'success') {
      loading.value = false
      switch (data.reason) {
        case 'no_such_room':
          return router.replace({ name: 'lobby' })
        case 'expire_room_token':
          return router.replace({
                                  name : 'lobby',
                                  query: {
                                    r: props.room_uuid,
                                    n: userName.value,
                                    p: userPassword.value,
                                  },
                                })
        default:
          loginAlertType.value = 'error'
          loginAlertText.value = 'ユーザー作成に失敗しました。'
          userNameInput.value?.select()
      }
      return
    }
    user_uuid  = data.user.uuid
    user_token = data.token
  }
  localStorage.setItem(user_uuid, JSON.stringify({ user_token }))
  if (!props.user_uuid || props.auto_play) {
    const next = {
      name  : props.auto_play ? 'play' : 'room-user',
      params: {
        room_uuid: props.room_uuid,
        user_uuid,
      },
    }
    console.log(JSON.stringify(next, null, '  '))
    if (isInitialLogin) {
      router.replace(next).then()
    } else {
      router.push(next).then()
    }
  }
  userLoggedInFlg.value = true
  loginDialog.value     = false
}

const gotoPlay = () => {
  return router.push({
                       name  : 'play',
                       params: {
                         room_uuid: props.room_uuid,
                         user_uuid: props.user_uuid,
                       },
                     })
}

const loginDialogCancel = () => {
  loginDialog.value = false
  if (!userLoggedInFlg.value) {
    return router.replace({
                            name  : 'room',
                            params: { room_uuid: props.room_uuid },
                          })
  }
}

const clickUser = (user_uuid: string) => {
  if (!userLoggedInFlg.value) {
    return showUserLogin(false, user_uuid)
  }
}

const userSort = () => {
  const userTypeOrder = ['master', 'player', 'visitor']
  users.value.sort((u1, u2) => {
    const u1Type = userTypeOrder.findIndex(t => t === u1.user_type)
    const u2Type = userTypeOrder.findIndex(t => t === u2.user_type)
    switch (true) {
      case u1Type > u2Type:
        return 1
      case u1Type < u2Type:
        return -1
      default:
        return u1.id > u2.id ? 1 : -1
    }
  })
}

const roomChannelSubscriptionHandler = {
  received(data: any) {
    console.log(JSON.stringify(data, null, '  '))
    switch (`[${data.table}]-[${data.type}]`) {
      case '[api_v1_users]-[create-data]':
        users.value.push(data.data)
        userSort()
        break
      case '[api_v1_users]-[destroy-data]':
        users.value.splice(users.value.findIndex(r => r.uuid === data.uuid), 1)
        break
      case '[api_v1_users]-[update-data]':
        users.value.splice(users.value.findIndex(r => r.uuid === data.data.uuid), 1, data.data)
        userSort()
        break
      default:
        console.log('ignore')
        break
    }
  },
}

const roomChannel = cable.subscriptions.create({
                                                 channel  : 'RoomChannel',
                                                 room_uuid: props.room_uuid,
                                               }, roomChannelSubscriptionHandler)

let usersChannel: any = null

onBeforeUnmount(() => {
  cable.subscriptions.remove(roomChannel)
  if (usersChannel) {
    cable.subscriptions.remove(usersChannel)
  }
})

const initialize = async () => {
  ready.value           = false
  userLoggedInFlg.value = false
  selectedUser.value.splice(0, selectedUser.value.length)
  const { user_token } = JSON.parse(props.user_uuid && localStorage.getItem(props.user_uuid) || '{}')
  const { room_token } = JSON.parse(localStorage.getItem(props.room_uuid) || '{}')

  const toLobby = (hasQuery: boolean, hasNewQuery?: boolean) => router
    .replace({
               name : 'lobby',
               query: hasQuery ? {
                 r        : props.room_uuid,
                 u        : props.user_uuid,
                 n        : hasNewQuery ? props.user_name : undefined,
                 p        : hasNewQuery ? props.user_password : undefined,
                 auto_play: props.auto_play,
               } : undefined,
             })

  const toRoom = (hasQuery: boolean) => router
    .replace({
               name  : 'room',
               params: { room_uuid: props.room_uuid },
               query : hasQuery ? {
                 u        : props.user_uuid,
                 auto_play: props.auto_play,
               } : undefined,
             })

  const toPlay = () => router.replace({
                                        name  : 'play',
                                        params: {
                                          room_uuid: props.room_uuid,
                                          user_uuid: props.user_uuid,
                                        },
                                      })

  if (!room_token) {
    return toLobby(true, true)
  }

  if (user_token !== undefined) {
    const userTokenCheck = `/api/v1/users/${props.user_uuid}/token/${user_token}/check`
    const { data }       = await axios.post(userTokenCheck, {
      room_uuid        : props.room_uuid,
      room_token,
      subscription_uuid: sessionState.state.session_uuid,
    })
    console.log(JSON.stringify(data, null, '  '))
    if (data.verify === 'success') {
      if (props.auto_play) {
        return toPlay()
      }
      roomData.value = data.room
      users.value.splice(0, users.value.length, ...data.users)
      userLoggedInFlg.value = true
    } else {
      switch (data.reason) {
        case 'no_such_room':
          return toLobby(false)
        case 'expire_room_token':
          return toLobby(true, false)
        case 'no_such_user':
          toRoom(false).then()
          break
        case 'expire_user_token':
          loginDialog.value = true
          userUuid.value    = props.user_uuid
          break
        default:
      }
      roomData.value = data.room
      users.value.splice(0, users.value.length, ...data.users)
    }
  } else {
    const { data } = await axios.post(`/api/v1/rooms/${props.room_uuid}/token/${room_token}/check`)
    console.log(JSON.stringify(data, null, '  '))
    if (data.verify !== 'success') {
      return toLobby(data.reason !== 'no_such_room', true)
    }
    roomData.value = data.room
    users.value.splice(0, users.value.length, ...data.users)
  }
  userSort()

  if (!userLoggedInFlg.value && props.user_uuid === undefined && props.user_name !== undefined) {
    isInitialLogin     = true
    loginDialog.value  = true
    userName.value     = props.user_name
    userPassword.value = props.user_password || ''
  }
  if (usersChannel) {
    cable.subscriptions.remove(usersChannel)
  }
  if (props.user_uuid) {
    const userChannelSubscriptionHandler = {
      received(data: any) {
        console.log(JSON.stringify(data, null, '  '))
        switch (data.type) {
          case 'notify_connection_info':
            switch (data.value) {
              case 'room-deleted':
                return toLobby(false)
              case 'user-deleted':
                return toRoom(false)
              case 'invalid-room-token':
                return toLobby(true)
              case 'invalid-user-token':
                return toRoom(true)
              default:
                break
            }
            break
          default:
        }
      },
    }

    usersChannel = cable.subscriptions.create({
                                                channel          : 'UsersChannel',
                                                room_uuid        : props.room_uuid,
                                                room_token,
                                                user_uuid        : props.user_uuid,
                                                user_token,
                                                subscription_uuid: sessionState.state.session_uuid,
                                              }, userChannelSubscriptionHandler)
  }
  ready.value = true
}
initialize().then()
watch([() => props.room_uuid, () => props.user_uuid], initialize)
</script>

<template>
  <v-layout>
    <v-app-bar prominent elevation='1' density='compact'>
      <v-app-bar-nav-icon
        variant='text' @click.stop='drawer = !drawer'
        :icon='drawer ? "mdi-chevron-right" : "mdi-chevron-left"'
      ></v-app-bar-nav-icon>
      <v-avatar image='https://quoridorn.com/img/mascot/normal/mascot_normal.png' class='ml-3' />
      <v-toolbar-title>
        部屋
        <template v-if='roomData'>#{{ roomData?.id || '' }} - {{ roomData?.name || '' }}</template>
        <template v-if='users.some(u => u.uuid === user_uuid)'> > {{
            users.find(u => u.uuid === user_uuid)?.name
          }}
        </template>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn variant='text' icon='mdi-brightness-6' @click='toggleTheme'></v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model='drawer2' :rail='drawer' rail-width='80' :permanent='true'>
      <v-list :nav='true' :selected='readonly(selectedUser)' @update:selected='updateSelectedUser'>
        <v-list-item @click='gotoLobby'>
          <template #prepend>
            <v-icon size='x-large' class='mr-2'>mdi-home-group</v-icon>
          </template>
          <transition name='fade'>
            <v-list-item-title class='pl-7' v-if='!drawer'>ロビー</v-list-item-title>
          </transition>
        </v-list-item>

        <v-divider />

        <template v-if='userLoggedInFlg'>
          <v-list-subheader v-if='user_uuid'>あなた</v-list-subheader>

          <v-list-item class='py-2'>
            <template #prepend>
              <user-icon :user='users.find(u => u.uuid === user_uuid)' />
            </template>
            <transition name='fade'>
              <v-list-item-title class='pl-7' v-if='!drawer'>{{ users.find(u => u.uuid === user_uuid)?.name || '' }}
              </v-list-item-title>
            </transition>
          </v-list-item>

          <v-list-item @click='gotoPlay()'>
            <template #prepend>
              <v-icon size='x-large' class='mr-2'>mdi-dice-multiple</v-icon>
            </template>
            <transition name='fade'>
              <v-list-item-title class='pl-7' v-if='!drawer'>プレイ</v-list-item-title>
            </transition>
          </v-list-item>

          <v-list-item @click='logout()' variant='tonal'>
            <template #prepend>
              <v-icon size='x-large' class='mr-2'>mdi-logout-variant</v-icon>
            </template>
            <transition name='fade'>
              <v-list-item-title class='pl-7' v-if='!drawer'>ログアウト</v-list-item-title>
            </transition>
          </v-list-item>
        </template>

        <v-list-subheader v-if='user_uuid'>{{ drawer ? 'Users' : '他のユーザー' }}</v-list-subheader>
        <v-list-subheader v-else>{{ drawer ? 'Log in' : 'ログイン' }}</v-list-subheader>

        <v-list-item @click='showUserLogin(false)' v-if='!user_uuid'>
          <template #prepend>
            <v-icon size='x-large' class='mr-2'>mdi-login-variant</v-icon>
          </template>
          <transition name='fade'>
            <v-list-item-title class='pl-7' v-if='!drawer'>新しいユーザー</v-list-item-title>
          </transition>
        </v-list-item>

        <template v-for='user in users' :key='user.uuid'>
          <v-list-item
            :value='user.uuid'
            @click='clickUser(user.uuid)'
            v-if='!userLoggedInFlg || user.uuid !== user_uuid'
            active-color='primary'
            class='py-2'
          >
            <template #prepend>
              <user-icon :user='user' />
            </template>
            <transition name='fade'>
              <v-list-item-title class='pl-7' v-if='!drawer'>{{ user.name }}</v-list-item-title>
            </transition>
          </v-list-item>
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
          :auto_play='auto_play'
          :users='users'
          :logged-in='userLoggedInFlg'
          :ready='ready'
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
            :disabled='userUuid=== undefined && (!userName || users.some(u => u.name === userName))'
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
</style>
