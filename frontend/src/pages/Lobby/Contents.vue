<script setup lang='ts'>
import { InjectionKeySymbol as roomKey, StoreType as RoomStore } from '~/data/room'
import { inject } from 'vue'
const roomState = inject(roomKey) as RoomStore
const axios = inject('axios') as any

import { useRouter } from 'vue-router'
const router = useRouter()

const props = defineProps<{
  opened_room_id?: string;
  user_id?: string;
}>()

import { computed, ref } from 'vue'
const loginDialog = ref(false)
const createRoomDialog = ref(false)
const showPassword = ref(false)
const roomPassword = ref('')
const createRoomName = ref('')
const loginRoomId = ref(0)
const selectedRoomName = computed(() => roomState.state.rooms.find(r => r.id === loginRoomId.value)?.name || null)
const loading = ref(false)
const loginResult = ref('')
const roomPasswordInput = ref<HTMLInputElement>()
const userPasswordInput = ref<HTMLInputElement>()

import { watch } from 'vue'
watch(() => roomState.state.ready, async value => {
  if (!value || props.opened_room_id === undefined) return
  if (!roomState.state.rooms.some(r => r.id === parseInt(props.opened_room_id || '0'))) {
    router.replace({ name: 'lobby' }).then()
    return
  }
  loginRoomId.value = parseInt(props.opened_room_id)
  if (await preRoomLogin(false, loginRoomId.value)) return
  loginDialog.value = true
})

const showCreateRoom = () => {
  loginResult.value = ''
  createRoomName.value = ''
  roomPassword.value = ''
  createRoomDialog.value = true
  loading.value = false
}

const preRoomLogin = async (push: boolean, id: number) => {
  let skipAble = false
  const localStorageData = localStorage.getItem(`room:${id}`)
  if (localStorageData) {
    const {uuid, token} = JSON.parse(localStorageData)
    const result = await axios.post(`/api/v1/token/verify/rooms`, { room_uuid: uuid, token, })
    skipAble = result.data.verify === 'success'
    if (skipAble) {
      if (push) {
        router.push({ name: 'room', params: { room_uuid: uuid }, query: { u: props.user_id } }).then()
      } else {
        router.replace({ name: 'room', params: { room_uuid: uuid }, query: { u: props.user_id } }).then()
      }
    } else {
      localStorage.removeItem(`room:${id}`)
      localStorage.removeItem(uuid)
    }
  }
  return skipAble
}

const showRoomLogin = async (id: number) => {
  if (await preRoomLogin(true, id)) return
  loginRoomId.value = id
  loginDialog.value = true
  loginResult.value = ''
  loading.value = false
  roomPassword.value = ''
}

const createRoom = async () => {
  createRoomDialog.value = false
  const result = await axios.post(`/api/v1/rooms.json`, {
    api_v1_room: {
      name: createRoomName.value,
      password: roomPassword.value,
    }
  })
  const token = result.data.token
  const uuid = result.data.room.uuid
  const id = result.data.room.id
  localStorage.setItem(uuid, JSON.stringify({token, room_id: id}))
  localStorage.setItem(`room:${id}`, JSON.stringify({uuid, token}))
  router.push({ name: 'room', params: { room_uuid: uuid }, query: { u: props.user_id } }).then()
}

const roomLogin = async () => {
  loading.value = true
  loginResult.value = ''
  const result = await axios.post(`/api/v1/rooms/${loginRoomId.value}/verify`, { password: roomPassword.value })
  const token = result.data.token
  const uuid = result.data.uuid
  const id = loginRoomId.value
  localStorage.setItem(uuid, JSON.stringify({token, room_id: id}))
  localStorage.setItem(`room:${id}`, JSON.stringify({uuid, token}))
  const verified = result.data.verify === 'success'
  const roomUuid = verified ? uuid : ''
  loading.value = false
  if (!verified) {
    loginResult.value = '部屋パスワードが違います'
    roomPasswordInput.value?.select()
  } else {
    await router.push({ name: 'room', params: { room_uuid: roomUuid }, query: { u: props.user_id } })
  }
}
</script>

<template>
  <v-container class='h-100'>
    <v-row :no-gutters='true'>
      <v-switch true-icon='mdi-sync-circle' label='自動同期' color='primary' :inset='false' v-model='roomState.state.autoSynchronize' density='compact' />
    </v-row>
    <v-row :no-gutters='true'>
      <v-col>
        <v-card class='overflow-auto' max-height='100%' height='calc(100vh - 158px)' :loading='!roomState.state.ready'>
          <v-table :fixed-header='true' class="h-100" v-if='roomState.state.ready'>
            <thead>
            <tr>
              <th class='text-right'>#</th>
              <th class='text-left' style='width: 100%'>部屋名</th>
              <th class='text-left text-right'>
                <v-btn append-icon='mdi-shape-rectangle-plus' color='primary' @click='showCreateRoom'>新規作成</v-btn>
              </th>
            </tr>
            </thead>
            <tbody>
            <tr v-for='room in roomState.state.rooms' :key='room.uuid'>
              <td class='text-right'>{{ room.id }}</td>
              <td>
                <v-card elevation='0' variant='text' class='mb-2'>
                  <v-card-title>{{ room.name }}</v-card-title>
                  <v-card-subtitle>最終ログイン: {{ $d(room.last_logged_in, 'long') }}</v-card-subtitle>
                </v-card>
              </td>
              <td class='text-right'>
                <v-btn append-icon='mdi-login' color='secondary' @click='showRoomLogin(room.id)'>入室</v-btn>
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
      <v-card-title v-text='`#${loginRoomId} ${selectedRoomName}`' />
      <v-card-subtitle>入室</v-card-subtitle>
      <v-card-text>
        <v-alert
          colored-border
          type='error'
          elevation='2'
          icon='$info'
          density='compact'
          :text='loginResult'
          class='mb-5'
          v-if='loginResult'
        ></v-alert>
        <v-text-field
          :append-icon='showPassword ? "mdi-eye" : "mdi-eye-off"'
          label='パスワード'
          :type='showPassword ? "text" : "password"'
          v-model='roomPassword'
          @click:append='showPassword = !showPassword'
          @keydown.enter='roomLogin'
          :autofocus='true'
          @keydown.esc='loginDialog = false'
          ref='roomPasswordInput'
        >
          <template #label>
            <v-icon icon='mdi-lock'></v-icon>パスワード
          </template>
        </v-text-field>
        <v-card-actions>
          <v-btn color='primary' variant='flat' @click='roomLogin' :loading='loading'>ログイン</v-btn>
          <v-btn color='secondary' variant='flat' @click='loginDialog = false'>キャンセル</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
  <v-dialog :model-value='createRoomDialog'>
    <v-card class='mx-auto mt-5 pa-3'>
      <v-card-title>部屋作成</v-card-title>
      <v-card-text>
        <v-alert
          colored-border
          type='error'
          elevation='2'
          icon='$info'
          density='compact'
          :text='loginResult'
          class='mb-5'
          :style='{visibility: loginResult ? "visible" : "hidden"}'
        ></v-alert>
        <v-text-field prepend-icon='mdi-home-variant' v-model='createRoomName' append-icon='empty' label='部屋名' :autofocus='true'></v-text-field>
        <v-text-field
          prepend-icon='mdi-lock'
          :append-icon='showPassword ? "mdi-eye" : "mdi-eye-off"'
          label='パスワード'
          :type='showPassword ? "text" : "password"'
          v-model='roomPassword'
          @click:append='showPassword = !showPassword'
          @keydown.enter='createRoom'
          ref='userPasswordInput'
        ></v-text-field>
        <v-card-actions>
          <v-btn color='primary' variant='flat' @click='createRoom' :loading='loading' :disabled='!createRoomName' append-icon='mdi-shape-rectangle-plus'>新規登録</v-btn>
          <v-btn color='secondary' variant='flat' @click='createRoomDialog = false'>キャンセル</v-btn>
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