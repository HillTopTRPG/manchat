<script setup lang='ts'>
import { computed, inject, watch } from 'vue'

const props = defineProps<{
  room_uuid: string;
  user_uuid?: string;
  user_name?: string;
  user_password?: string;
  auto_play?: number;
}>()

import Contents from '~/pages/Room/Contents.vue'

import { useTheme } from 'vuetify'
const theme = useTheme()
theme.global.name.value = localStorage.getItem('view.theme') || 'light'
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  localStorage.setItem('view.theme', theme.global.name.value)
}

import { useRouter } from 'vue-router'
const router = useRouter()

const axios = inject('axios') as any
const cable = inject('cable') as any

import { ref } from 'vue'
const drawer = ref(false)
const drawer2 = ref(true)
const contentRef = ref()
const roomData = ref<{uuid: string; name: string} | null>(null)
const users = ref<{
    id: number;
    uuid: string;
    name: string;
    room_uuid: string;
    last_logged_in: Date;
    created_at: Date;
    updated_at: Date;
}[]>([])

let user_token = ''
const userUuid = ref<string | undefined>(undefined)
const loginDialog = ref(false)
const userName = ref('')
const userPassword = ref('')
const userShowPassword = ref(false)
const loading = ref(false)
const loginAlertType = ref('error')
const loginAlertIcon = ref('$info')
const loginAlertText = ref('')
const userPasswordInput = ref<HTMLInputElement>()

const selectedUser = ref<string[]>([])
const updateSelectedUser = (newList: string[]) => {
  selectedUser.value.splice(0, selectedUser.value.length, ...newList)
}

watch(() => props.user_uuid, () => {
  if (props.user_uuid) {
    selectedUser.value.splice(0, selectedUser.value.length, props.user_uuid)
  }
})

const gotoLobby = () => {
  router.push({ name: 'lobby' }).then()
}

const logout = () => {
  router.push({ name: 'room', params: { room_uuid: props.room_uuid } }).then()
  selectedUser.value.splice(0, selectedUser.value.length)
}
let isInitialLogin = false

const existsUserName = computed(() => users.value.find(u => u.uuid === userUuid.value)?.name || '')
const userLoggedInFlg = ref(false)

watch(() => props.user_uuid, () => {
  console.log(props.user_uuid)
  if (!props.user_uuid) {
    userLoggedInFlg.value = false
  }
}, { immediate: true })

const preUserLogin = async (user_uuid?: string) => {
  if (user_uuid === undefined) return false
  const { user_token, room_uuid } = JSON.parse(localStorage.getItem(user_uuid || '') || '{}')
  console.log({ user_token, room_uuid })
  if (user_token && room_uuid) {
    const { room_token } = JSON.parse(localStorage.getItem(room_uuid) || '{}')
    const { data } = await axios.post(
      `/api/v1/users/${user_uuid}/token/${user_token}/check`,
      { room_uuid: props.room_uuid, room_token, }
    )
    console.log(JSON.stringify(data, null, '  '))
    if (data.verify === 'success') {
      const name = props.auto_play ? 'play' : 'room-user'
      const params = { room_uuid: props.room_uuid, user_uuid, }
      userLoggedInFlg.value = true
      loginDialog.value = false
      if (isInitialLogin) router.replace({ name, params }).then()
      else router.push({ name, params }).then()
      return true
    }
  }
  return false
}

const showUserLogin = async (initialLogin: boolean, user_uuid?: string) => {
  isInitialLogin = initialLogin
  if (await preUserLogin(user_uuid)) return true
  loginDialog.value = true
  userUuid.value = user_uuid
  loginAlertText.value = ''
  loading.value = false
  userName.value = ''
  userPassword.value = ''
  return false
}

const userLogin = async () => {
  loginAlertText.value = ''
  let user_uuid = ''
  const { room_token } = JSON.parse(localStorage.getItem(props.room_uuid) || '{}')
  if (userUuid.value !== undefined) {
    loading.value = true
    loginAlertType.value = 'info'
    loginAlertText.value = 'ログイン中'
    const { data } = await axios.post(`/api/v1/users/${userUuid.value}/login`, {
      password: userPassword.value,
      room_uuid: props.room_uuid,
      room_token,
    })
    console.log(JSON.stringify(data, null, '  '))
    const verified = data.verify === 'success'
    user_uuid = verified ? data.uuid : ''
    user_token = verified ? data.token : ''
    if (!verified) {
      loading.value = false
      if (data.reason === 'expire_room_token') {
        router.replace({
          name: 'lobby',
          query: { r: props.room_uuid, u: userUuid.value, auto_play: props.auto_play, },
        }).then()
        return
      }
      if (data.reason === 'different_room_uuid') {
        loginAlertType.value = 'error'
        loginAlertText.value = '違う部屋のユーザーにログインしようとしました'
      }
      if (data.reason === 'invalid_password') {
        loginAlertType.value = 'error'
        loginAlertText.value = 'ユーザーパスワードが違います'
        userPasswordInput.value?.select()
      }
      return
    }
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
    loading.value = true
    loginAlertType.value = 'info'
    loginAlertText.value = 'ログイン中'
    const { data } = await axios.post(`/api/v1/users`, {
      api_v1_user: {
        name: userName.value,
        password: userPassword.value,
        room_uuid: props.room_uuid,
      },
      room_token,
    })
    console.log(JSON.stringify(data, null, '  '))
    const verified = data.verify === 'success'
    user_uuid = verified ? data.user.uuid : ''
    user_token = verified ? data.token : ''
    if (!verified) {
      if (data.reason === 'expire_room_token') {
        router.replace({
          name: 'lobby',
          query: { r: props.room_uuid, n: userName.value, p: userPassword.value }
        }).then()
        return
      }
      loginAlertText.value = `Un supported error. ${data.reason}`
      loading.value = false
      userPasswordInput.value?.select()
      return
    }
  }
  localStorage.setItem(user_uuid, JSON.stringify({ user_token, room_uuid: props.room_uuid }))
  const next = {
    name: props.auto_play ? 'play' : 'room-user',
    params: { room_uuid: props.room_uuid, user_uuid }
  }
  if (isInitialLogin) {
    router.replace(next).then()
  } else {
    router.push(next).then()
  }
  userLoggedInFlg.value = true
  loginDialog.value = false
}

const gotoPlay = () => {
  router.push({ name: 'play', params: { room_uuid: props.room_uuid, user_uuid: props.user_uuid } }).then()
}

const loginDialogCancel = () => {
  loginDialog.value = false
  if (!userLoggedInFlg.value) router.replace({ name: 'room', params: { room_uuid: props.room_uuid } }).then()
}

const clickUser = (user_uuid: string) => {
  if (!userLoggedInFlg.value) {
    showUserLogin(false, user_uuid).then()
    return
  }
}

(async () => {
  const { room_token } = JSON.parse(localStorage.getItem(props.room_uuid) || '{}')
  const toLobbyQuery = {
    r: props.room_uuid,
    u: props.user_uuid,
    n: props.user_name,
    p: props.user_password,
    auto_play: props.auto_play,
  }
  if (!room_token) {
    // 部屋トークンが取得できない状況はロビーに戻す
    router.replace({ name: 'lobby', query: toLobbyQuery, }).then()
    return
  }
  const { data: roomsResult } = await axios.post(`/api/v1/rooms/${props.room_uuid}/token/${room_token}/check`)
  console.log(JSON.stringify(roomsResult, null, '  '))
  if (roomsResult.verify !== 'success') {
    router.replace({ name: 'lobby', query: roomsResult.reason === 'no_such_room' ? undefined : toLobbyQuery }).then()
    return
  }
  roomData.value = roomsResult.room
  users.value.push(...roomsResult.users)
  cable.subscriptions.create({ channel: 'RoomChannel', room_uuid: props.room_uuid }, {
    received(data: any) {
      console.log(JSON.stringify(data, null, '  '))
      if (data.type === 'create-data') {
        users.value.push(data.data)
      }
      if (data.type === 'destroy-data') {
        users.value.splice(users.value.findIndex(r => r.uuid === data.uuid), 1)
      }
    },
  })
  if (props.user_uuid !== undefined) {
    if (!users.value.some(u => u.uuid === props.user_uuid)) {
      router.replace({ name: 'room', params: { room_uuid: props.room_uuid } }).then()
      return
    }
    showUserLogin(true, props.user_uuid).then()
  } else {
    if (!userLoggedInFlg.value && props.user_name !== undefined) {
      isInitialLogin = true
      loginDialog.value = true
      userName.value = props.user_name
      userPassword.value = props.user_password || ''
    }
  }
})().then()
</script>

<template>
  <v-layout>
    <v-app-bar prominent elevation='1' density='compact'>
      <v-app-bar-nav-icon variant='text' @click.stop='drawer = !drawer' :icon='drawer ? "mdi-chevron-right" : "mdi-chevron-left"'></v-app-bar-nav-icon>
      <v-avatar image='https://quoridorn.com/img/mascot/normal/mascot_normal.png' class='ml-3' />
      <v-toolbar-title>
        部屋
        <template v-if='roomData'>#{{ roomData?.id || '' }} - {{ roomData?.name || '' }}</template>
        <template v-if='users.some(u => u.uuid === user_uuid)'> > {{ users.find(u => u.uuid === user_uuid)?.name }}</template>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn variant='text' icon='mdi-brightness-6' @click='toggleTheme'></v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model='drawer2' :rail='drawer' rail-width='80' :permanent='true'>
      <v-list nav :selected='selectedUser' @update:selected='updateSelectedUser'>
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
              <v-badge color='red-accent-1' bordered location='right top' content='GM' style='box-sizing: border-box'>
                <v-badge color='text-grey-darken-3' location='right bottom' icon='mdi-circle'>
                  <template #badge>
                    <v-icon class='text-grey-darken-5'>mdi-circle</v-icon>
                  </template>
                  <v-icon class='pa-5 bg-cyan-accent-1' size='x-large' style='border-radius: 50%'>mdi-account</v-icon>
                </v-badge>
              </v-badge>
            </template>
            <transition name='fade'>
              <v-list-item-title class='pl-7' v-if='!drawer'>{{users.find(u => u.uuid === user_uuid)?.name || ''}}</v-list-item-title>
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

          <v-list-item @click='logout()' variant="tonal">
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
              <v-badge color='red-accent-1' bordered location='right top' content='GM' style='box-sizing: border-box'>
                <v-badge color='text-grey-darken-3' location='right bottom' icon='mdi-circle'>
                  <template #badge>
                    <v-icon class='text-grey-darken-5'>mdi-circle</v-icon>
                  </template>
                  <v-icon class='pa-5 bg-cyan-accent-1' size='x-large' style='border-radius: 50%'>mdi-account</v-icon>
                </v-badge>
              </v-badge>
            </template>
            <transition name='fade'>
              <v-list-item-title class='pl-7' v-if='!drawer'>{{user.name}}</v-list-item-title>
            </transition>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <suspense>
        <contents
          :room_uuid='room_uuid'
          :user_uuid='user_uuid'
          :user_name='user_name'
          :user_password='user_password'
          :auto_play='auto_play'
          :logged-in='userLoggedInFlg'
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
        <v-text-field
          v-model='userName'
          append-icon='empty'
          :autofocus='userUuid === undefined'
          @keydown.esc='loginDialog = false'
          @keydown.enter='userPasswordInput.focus()'
          v-if='userUuid === undefined'
        >
          <template #label>
            <v-icon>mdi-account-circle</v-icon>ユーザー名
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
            <v-icon>mdi-lock</v-icon>パスワード
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
          >{{userUuid === undefined ? '新規登録' : 'ログイン'}}</v-btn>
          <v-btn color='secondary' variant='flat' @click='loginDialogCancel()'>キャンセル</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style deep lang='css'>
.v-list-item__prepend > .v-icon {
  margin-right: 5px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
