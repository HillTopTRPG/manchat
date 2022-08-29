<script setup lang='ts'>
const props = defineProps<{
  room_uuid: string;
  user_id?: string;
  user_name?: string;
  user_password?: string;
}>()

import { useRouter } from 'vue-router'
const router = useRouter()

import { inject } from 'vue'
const axios = inject('axios') as any

let roomToken = ''
let user_token = ''
let user_uuid = ''

import { computed, ref } from 'vue'
const users = ref<{ id: number; name: string; }[]>([]);
const userId = ref<number | undefined>(undefined)
const existsUserName = computed(() => users.value.find(u => u.id === userId.value)?.name || "")
const loginDialog = ref(false)
const userName = ref('')
const userPassword = ref('')
const userShowPassword = ref(false)
const loading = ref(false)
const loginAlertType = ref('error')
const loginAlertIcon = ref('$info')
const loginAlertText = ref('')
const userPasswordInput = ref<HTMLInputElement>()

const preUserLogin = async (push: boolean, id?: number) => {
  if (id === undefined) return false
  let skipAble = false
  const localStorageUserDataString = localStorage.getItem(`user:${id}`)
  if (localStorageUserDataString) {
    const { user_uuid, user_token } = JSON.parse(localStorageUserDataString)
    const localStorageRoomDataString = localStorage.getItem(props.room_uuid)
    const room_token = (localStorageRoomDataString ? JSON.parse(localStorageRoomDataString) : null)?.token
    const result = await axios.post(`/api/v1/token/verify/users`, { room_uuid: props.room_uuid, user_uuid, user_token, room_token, })
    skipAble = result.data.verify === 'success'
    if (skipAble) {
      if (push) {
        router.push({ name: 'play', params: { user_uuid } }).then()
      } else {
        router.replace({ name: 'play', params: { user_uuid } }).then()
      }
      return skipAble
    }
  }
  return skipAble
}

await (async () => {
  let loggedIn = false
  const localStorageDataString = localStorage.getItem(props.room_uuid)
  if (localStorageDataString) {
    const { token, room_id } = JSON.parse(localStorageDataString)
    roomToken = token
    const result = await axios.post(`/api/v1/token/verify/rooms`, { room_uuid: props.room_uuid, token, })
    loggedIn = result.data.verify === 'success'
    if (loggedIn) {
      users.value.push(...result.data.users)
      if (props.user_id !== undefined) {
        userId.value = parseInt(props.user_id)
        if (!users.value.some(u => u.id === parseInt(props.user_id || '0'))) {
          router.replace({ name: 'room', params: { room_uuid: props.room_uuid } }).then()
          return
        } else {
          if (await preUserLogin(false, parseInt(props.user_id))) return
          loginDialog.value = true
        }
      }
      if (props.user_name !== undefined) {
        userName.value = props.user_name
        loginDialog.value = true

        if (props.user_password !== undefined) {
          userPassword.value = props.user_password
        }
      }
    }
  }

  if (!loggedIn) {
    const result = await axios.get(`/api/v1/rooms/u/${props.room_uuid}`)
    router.replace({ name: 'lobby', query: { r: result.data?.id, u: props.user_id, n: props.user_name, p: props.user_password } }).then()
  }
})()

const showUserLogin = async (id?: number) => {
  if (await preUserLogin(true, id)) return
  userId.value = id
  loginDialog.value = true
  loginAlertText.value = ''
  loading.value = false
  userPassword.value = ''
}

const userLogin = async () => {
  loginAlertText.value = ''
  user_uuid = ''
  if (userId.value !== undefined) {
    loading.value = true
    loginAlertType.value = 'info'
    loginAlertText.value = 'ログイン中'
    const result = await axios.post(`/api/v1/users/${userId.value}/verify`, { password: userPassword.value, room_token: roomToken, })
    const verified = result.data.verify === 'success'
    user_uuid = verified ? result.data.uuid : ''
    user_token = verified ? result.data.token : ''
    if (!verified) {
      loading.value = false
      if (result.data.reason === 'expire_room_token') {
        loginAlertType.value = 'error'
        loginAlertText.value = '部屋トークンが有効期限切れです'
      }
      if (result.data.reason === 'different_room_uuid') {
        loginAlertType.value = 'error'
        loginAlertText.value = '違う部屋のユーザーにログインしようとしました'
      }
      if (result.data.reason === 'invalid_password') {
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
    const result = await axios.post(`/api/v1/users`, {
      api_v1_user: {
        name: userName.value,
        password: userPassword.value,
        room_uuid: props.room_uuid,
      },
      room_token: roomToken,
    })
    const verified = result.data.verify === 'success'
    userId.value = verified ? result.data.user.id : undefined
    user_uuid = verified ? result.data.user.uuid : ''
    user_token = verified ? result.data.token : ''
    if (!verified) {
      if (result.data.reason === 'expire_room_token') {
        router.replace({ name: 'lobby', query: { r: result.data.room_id, n: userName.value, p: userPassword.value } })
      } else loginAlertText.value = `Un supported error. ${result.data.reason}`
      loading.value = false
      userPasswordInput.value?.select()
      return
    }
  }
  localStorage.setItem(user_uuid, JSON.stringify({ user_token, room_uuid: props.room_uuid, user_id: userId.value }))
  localStorage.setItem(`user:${userId.value}`, JSON.stringify({ user_uuid, user_token }))
  router.push({ name: 'play', params: { user_uuid } }).then()
}
</script>

<template>
  <v-container class='h-100'>
    <v-row :no-gutters='true'>
      <v-col>
        <v-card class='overflow-auto' max-height='100%'>
          <v-table :fixed-header='true' height='calc(100vh - 158px)'>
            <thead>
            <tr>
              <th class='text-left' style='width: 100%'>ユーザー名</th>
              <th class='text-left text-right'>
                <v-btn append-icon='mdi-shape-rectangle-plus' color='primary' @click='showUserLogin()'>新規参入</v-btn>
              </th>
            </tr>
            </thead>
            <tbody>
            <tr v-for='user in users' :key='user.id'>
              <td>
                <v-card elevation='0' variant='text' class='mb-2'>
                  <v-card-title>{{user.name}}</v-card-title>
                </v-card>
              </td>
              <td class='text-right'>
                <v-btn append-icon='mdi-login' color='secondary' @click='showUserLogin(user.id)'>入室</v-btn>
              </td>
            </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <v-dialog :model-value='loginDialog'>
    <v-card class='mx-auto mt-5 pa-3' :loading='loading'>
      <v-card-title v-text='userId !== undefined ? existsUserName : "新規参入"' />
      <v-card-subtitle v-text='"ログイン"' />
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
          :autofocus='userId === undefined'
          @keydown.esc='loginDialog = false'
          @keydown.enter='userPasswordInput.focus()'
          v-if='userId === undefined'
        >
          <template #label>
            <v-icon icon='mdi-account-circle'></v-icon>ユーザー名
          </template>
        </v-text-field>
        <v-text-field
          :append-icon='userShowPassword ? "mdi-eye" : "mdi-eye-off"'
          :type='userShowPassword ? "text" : "password"'
          v-model='userPassword'
          @click:append='userShowPassword = !userShowPassword'
          @keydown.enter='userLogin'
          @keydown.esc='loginDialog = false'
          :autofocus='userId !== undefined'
          ref='userPasswordInput'
        >
          <template #label>
            <v-icon icon='mdi-lock'></v-icon>パスワード
          </template>
        </v-text-field>
        <v-card-actions>
          <v-btn
            color='primary'
            variant='flat'
            @click='userLogin'
            :loading='loading'
            :disabled='userId === undefined && (!userName || users.some(u => u.name === userName))'
            :append-icon='userId === undefined ? "mdi-account-plus" : "mdi-login"'
          >{{userId === undefined ? '新規登録' : 'ログイン'}}</v-btn>
          <v-btn color='secondary' variant='flat' @click='loginDialog = false'>キャンセル</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style deep lang='css'>
.v-table .v-card-title,
.v-table .v-card-subtitle,
.v-table .v-card-item {
  padding-left: 0;
  padding-right: 0;
}
</style>