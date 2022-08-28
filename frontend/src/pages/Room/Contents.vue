<script setup lang='ts'>
const props = defineProps<{
  room_uuid: string;
}>()

import { useRouter } from 'vue-router'
const router = useRouter()

import { inject } from 'vue'
const axios = inject('axios') as any

let roomToken = ''
let userToken = ''
let userUuid = ''

import { computed, ref } from 'vue'
const users = ref<{ id: number; name: string; }[]>([]);
const userId = ref<number | undefined>(undefined)
const existsUserName = computed(() => users.value.find(u => u.id === userId.value)?.name || "")
const loginDialog = ref(false)
const userName = ref('')
const userPassword = ref('')
const userShowPassword = ref(false)
const loading = ref(false)
const loginResult = ref('')
const userPasswordInput = ref<HTMLInputElement>()

await (async () => {
  let loggedIn = false
  const localStorageDataString = localStorage.getItem(props.room_uuid)
  if (localStorageDataString) {
    const { token } = JSON.parse(localStorageDataString)
    roomToken = token
    const result = await axios.post(`/api/v1/token/verify/rooms.json`, { room_uuid: props.room_uuid, token, })
    loggedIn = result.data.verify === 'success'
    if (loggedIn) {
      users.value.push(...result.data.users)
    }
  }

  if (!loggedIn) {
    const result = await axios.get(`/api/v1/rooms/u/${props.room_uuid}`)
    router.replace({ name: 'lobby', query: { r: result.data?.id } }).then()
  }
})()

const showUserLogin = async (id?: number) => {
  userId.value = id
  if (id !== undefined) {
    const localStorageUserData = localStorage.getItem(`user:${id}`)
    if (localStorageUserData) {
      const { uuid, token } = JSON.parse(localStorageUserData)
      const result = await axios.post(`/api/v1/token/verify/users`, { room_uuid: props.room_uuid, user_uuid: uuid, token, })
      if (result.data.verify === 'success') {
        await router.push({ name: 'play', params: { user_uuid: uuid } })
        return
      }
    }
  }
  loginDialog.value = true
  loginResult.value = ''
  loading.value = false
  userPassword.value = ''
}

const userLogin = async () => {
  loginResult.value = ''
  userUuid = ''
  if (userId.value !== undefined) {
    loading.value = true
    const result = await axios.post(`/api/v1/users/${userId.value}/verify`, { password: userPassword.value, room_token: roomToken, })
    const verified = result.data.verify === 'success'
    userUuid = verified ? result.data.uuid : ''
    userToken = verified ? result.data.token : ''
    if (!verified) {
      loading.value = false
      if (result.data.reason === 'expire_room_token') loginResult.value = '部屋トークンが有効期限切れです'
      if (result.data.reason === 'different_room_uuid') loginResult.value = '違う部屋のユーザーにログインしようとしました'
      if (result.data.reason === 'invalid_password') {
        loginResult.value = 'ユーザーパスワードが違います'
        userPasswordInput.value?.select()
      }
      return
    }
  } else {
    if (!userName.value) {
      alert('ユーザー名を入力してください。')
      return
    }
    if (users.value.some(u => u.name === userName.value)) {
      alert('名前が重複しています。')
      return
    }
    loading.value = true
    const result = await axios.post(`/api/v1/users`, {
      api_v1_user: {
        name: userName.value,
        password: userPassword.value,
        room_uuid: props.room_uuid,
      },
      room_token: roomToken,
    })
    const verified = result.data.verify === 'success'
    userId.value = verified ? result.data.user.id : ''
    userUuid = verified ? result.data.user.uuid : ''
    userToken = verified ? result.data.token : ''
    if (!verified) {
      if (result.data.reason === 'expire_room_token') loginResult.value = '部屋トークンが有効期限切れです'
      else loginResult.value = `Un supported error. ${result.data.reason}`
      loading.value = false
      userPasswordInput.value?.select()
      return
    }
  }
  localStorage.setItem(userUuid, JSON.stringify({token: userToken}))
  localStorage.setItem(`user:${userId.value}`, JSON.stringify({uuid: userUuid, token: userToken}))
  router.push({ name: 'play', params: { user_uuid: userUuid } }).then()
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
    <v-card class='mx-auto mt-5 pa-3'>
      <v-card-title v-text='userId !== undefined ? existsUserName : "新規参入"' />
      <v-card-subtitle v-text='"ログイン"' />
      <v-card-text>
        <v-alert
          colored-border
          type='error'
          elevation='2'
          icon='$info'
          density='compact'
          class='mb-5'
          :text='loginResult'
          v-if='loginResult'
        ></v-alert>
        <v-text-field
          v-model='userName'
          append-icon='empty'
          :autofocus='userId === undefined'
          @keydown.esc='loginDialog = false'
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
            :disabled='!userName || users.some(u => u.name === userName)'
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