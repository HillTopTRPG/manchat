<script setup lang='ts'>
const props = defineProps<{
  room_uuid: string;
  user_uuid?: string;
  user_name?: string;
  user_password?: string;
  auto_play?: number;
}>()

import { useRouter } from 'vue-router'
const router = useRouter()

import {inject, watch} from 'vue'
const axios = inject('axios') as any

let user_token = ''

import { computed, ref } from 'vue'
const users = ref<{ id: number; uuid: string; name: string; }[]>([])
const userUuid = ref<string | undefined>(undefined)
const existsUserName = computed(() => users.value.find(u => u.uuid === userUuid.value)?.name || '')
const loginDialog = ref(false)
const userName = ref('')
const userPassword = ref('')
const userShowPassword = ref(false)
const loading = ref(false)
const loginAlertType = ref('error')
const loginAlertIcon = ref('$info')
const loginAlertText = ref('')
const userPasswordInput = ref<HTMLInputElement>()
const userLoggedInFlg = ref(false)
let isInitialLogin = false

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

defineExpose({
  addUser: () => {
    showUserLogin(false).then()
  },
  loginUser: (user_uuid: string) => {
    showUserLogin(false, user_uuid).then()
  },
})

const showUserLogin = async (initialLogin: boolean, user_uuid?: string) => {
  isInitialLogin = initialLogin
  if (await preUserLogin(user_uuid)) return
  loginDialog.value = true
  userUuid.value = user_uuid
  loginAlertText.value = ''
  loading.value = false
  userName.value = ''
  userPassword.value = ''
}

await (async () => {
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

  users.value.push(...roomsResult.users)
  if (props.user_uuid !== undefined) {
    if (!users.value.some(u => u.uuid === props.user_uuid)) {
      router.replace({ name: 'room', params: { room_uuid: props.room_uuid } }).then()
      return
    }
    await showUserLogin(true, props.user_uuid)
  }
  if (!userLoggedInFlg.value && props.user_uuid === undefined && props.user_name !== undefined) {
    isInitialLogin = true
    loginDialog.value = true
    userName.value = props.user_name
    userPassword.value = props.user_password || ''
  }
})()

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
        loginAlertType.value = 'error'
        loginAlertText.value = '部屋トークンが有効期限切れです'
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

const copiedNotify = ref(false)
let copyToolTipTimeoutId: number | undefined = undefined
const copy = (text: string) => {
  copiedNotify.value = false
  navigator.clipboard.writeText(text)
    .then(() => {
      console.log('Text copied to clipboard...')
    })
    .catch(err => {
      console.log('Something went wrong', err);
    })
  setTimeout(() => {
    copiedNotify.value = true
    if (copyToolTipTimeoutId !== undefined) clearTimeout(copyToolTipTimeoutId)
    copyToolTipTimeoutId = setTimeout(() => {
      copiedNotify.value = false
      copyToolTipTimeoutId = undefined
    }, 2000)
  }, 100)
}

const inviteUrl = location.host + router.resolve({ name: 'room', params: { room_uuid: props.room_uuid } })?.href

const gotoPlay = () => {
  router.push({ name: 'play', params: { room_uuid: props.room_uuid, user_uuid: props.user_uuid } }).then()
}

const loginDialogCancel = () => {
  loginDialog.value = false
  router.replace({ name: 'room', params: { room_uuid: props.room_uuid } }).then()
}
</script>

<template>
  <v-list class='ma-4'>
    <v-list-item @click='copy(inviteUrl)'>
      <template #prepend>
        <v-icon>mdi-account-plus</v-icon>
        部屋への招待URL
      </template>
      <span class='ml-5' style='white-space: nowrap;'>{{ inviteUrl }}</span>
      <v-icon class='ml-1'>mdi-content-copy</v-icon>
      <v-tooltip v-model='copiedNotify' v-if='copiedNotify' location='right'>
        <template v-slot:activator='{ props }'>
          <span v-bind='props'></span>
        </template>
        <span>コピーしました</span>
      </v-tooltip>
    </v-list-item>
  </v-list>

  <v-btn
    class='ma-4'
    color='yellow-accent-1'
    elevation='3'
    location='top'
    v-if='userLoggedInFlg'
    @click='gotoPlay()'
    size='x-large'
    prepend-icon='mdi-dice-multiple'
  >プレイ</v-btn>

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
.v-table .v-card-title,
.v-table .v-card-subtitle,
.v-table .v-card-item {
  padding-left: 0;
  padding-right: 0;
}
</style>