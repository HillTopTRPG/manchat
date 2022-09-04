<script setup lang='ts'>
import { InjectionKeySymbol as roomKey, StoreType as RoomStore } from '~/data/room'
import { computed, inject, ref, watch } from 'vue'
import { RouteLocationRaw, useRouter } from 'vue-router'

const roomState = inject(roomKey) as RoomStore
const axios     = inject('axios') as any

const router = useRouter()

const props = defineProps<{
  room_uuid?: string
  user_uuid?: string
  user_name?: string
  user_password?: string
  auto_play?: string
}>()

const loginDialog       = ref(false)
const createRoomDialog  = ref(false)
const showPassword      = ref(false)
const roomPassword      = ref('')
const createRoomName    = ref('')
const roomUuid          = ref(props.room_uuid || '')
const selectedRoom      = computed(() => roomState.state.rooms.find(r => r.uuid === roomUuid.value) || null)
const loading           = ref(false)
const loginAlertType    = ref('error')
const loginAlertIcon    = ref('$info')
const loginAlertText    = ref('')
const roomPasswordInput = ref<HTMLInputElement>()
const roomNameInput     = ref<HTMLInputElement>()
const userPasswordInput = ref<HTMLInputElement>()
let isInitialLogin      = false

watch(() => props.room_uuid, () => {
  roomUuid.value = props.room_uuid || ''
})
watch(() => roomState.state.ready, async () => {
  if (roomState.state.ready && props.room_uuid !== undefined) {
    if (!roomState.state.rooms.some(r => r.uuid === props.room_uuid)) {
      localStorage.removeItem(props.room_uuid)
      router.replace({ name: 'lobby' }).then()
      return
    }
    showRoomLogin(true, props.room_uuid).then()
  }
})

const preRoomLogin = async (room_uuid?: string) => {
  if (room_uuid === undefined) {
    return false
  }
  const { room_token } = JSON.parse(localStorage.getItem(room_uuid) || '{}')
  if (!room_token) {
    return false
  }
  const { data } = await axios.post(`/api/v1/rooms/${room_uuid}/token/${room_token}/check`)
  console.log(JSON.stringify(data, null, '  '))
  if (data.verify === 'success') {
    const next: RouteLocationRaw = {
      name  : 'room',
      params: { room_uuid },
      query : {
        u        : props.user_uuid,
        n        : props.user_name,
        p        : props.user_password,
        auto_play: props.auto_play,
      },
    }
    if (isInitialLogin) {
      router.replace(next).then()
    } else {
      router.push(next).then()
    }
    return true
  }
  return false
}

const showRoomLogin = async (initialLogin: boolean, room_uuid?: string) => {
  isInitialLogin       = initialLogin
  loginAlertText.value = ''
  loading.value        = false
  roomPassword.value   = ''
  if (room_uuid !== undefined) {
    if (await preRoomLogin(room_uuid)) {
      return
    }
    loginDialog.value = true
    roomUuid.value    = room_uuid
  } else {
    createRoomDialog.value = true
    createRoomName.value   = ''
  }
}

const roomLoginFunc = async (room_uuid?: string) => {
  loading.value  = true
  let room_token = ''
  if (room_uuid !== undefined) {
    const { data } = await axios.post(`/api/v1/rooms/${room_uuid}/login`, { password: roomPassword.value })
    console.log(JSON.stringify(data, null, '  '))
    loading.value = false
    if (data.verify !== 'success') {
      loginAlertType.value = 'error'
      loginAlertText.value = '部屋パスワードが違います'
      roomPasswordInput.value?.select()
      return
    }
    room_token           = data.room_token
    loginAlertType.value = 'info'
    loginAlertText.value = 'ログイン中'
  } else {
    const { data } = await axios.post(`/api/v1/rooms`, {
      api_v1_room: {
        name    : createRoomName.value,
        password: roomPassword.value,
      },
    })
    console.log(JSON.stringify(data, null, '  '))
    loading.value = false
    if (!data.success) {
      loginAlertType.value = 'error'
      loginAlertText.value = '部屋作成に失敗しました。'
      roomNameInput.value?.select()
      return
    }
    room_token = data.room_token
    room_uuid  = data.room.uuid
  }

  console.log(JSON.stringify({
                               room_uuid,
                               room_token,
                             }, null, '  '))
  localStorage.setItem(room_uuid || '', JSON.stringify({ room_token }))
  const next = {
    name  : 'room',
    params: { room_uuid },
    query : {
      u        : props.user_uuid,
      n        : props.user_name,
      p        : props.user_password,
      auto_play: props.auto_play,
    },
  }
  if (isInitialLogin) {
    router.replace(next).then()
  } else {
    router.push(next).then()
  }
}

defineExpose({
               login: (room_uuid: string) => {
                 showRoomLogin(false, room_uuid).then()
               },
             })
</script>

<template>
  <v-container class='h-100'>
    <v-row :no-gutters='true'>
      <v-col>
        <v-card class='overflow-auto' max-height='100%' height='calc(100vh - 80px)' :loading='!roomState.state.ready'>
          <v-table :fixed-header='true' class='h-100' v-if='roomState.state.ready'>
            <thead>
            <tr>
              <th class='text-right'>#</th>
              <th class='text-left' style='width: 100%'>部屋名</th>
              <th class='text-left text-right'>
                <v-btn
                  append-icon='mdi-shape-rectangle-plus'
                  color='primary'
                  @click='showRoomLogin(false)'
                >新規作成
                </v-btn>
              </th>
            </tr>
            </thead>
            <tbody>
            <tr v-for='room in roomState.state.rooms' :key='room.uuid'>
              <td class='text-center' style='min-width: 70px; box-sizing: border-box;'>
                <v-checkbox
                  :model-value='roomState.state.favoriteRooms.some(uuid => uuid === room.uuid)'
                  true-icon='mdi-star'
                  false-icon='mdi-star-outline'
                  @click='roomState.changeRoomFavorite(room.uuid)'
                />
              </td>
              <td>
                <v-card elevation='0' variant='text' class='mb-2'>
                  <v-card-title class='px-0'>#{{ room.id }} {{ room.name }}</v-card-title>
                  <v-card-subtitle class='px-0'>最終ログイン: {{
                      // noinspection JSCheckFunctionSignatures
                      $d(room.last_logged_in, 'long')
                    }}
                  </v-card-subtitle>
                </v-card>
              </td>
              <td class='text-right'>
                <v-btn append-icon='mdi-login' color='secondary' @click='showRoomLogin(false, room.uuid)'>入室</v-btn>
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
      <v-card-title v-text='`#${selectedRoom?.id} ${selectedRoom?.name}`' />
      <v-card-subtitle>入室</v-card-subtitle>
      <v-card-text>
        <v-alert
          colored-border
          :type='loginAlertType'
          elevation='2'
          :icon='loginAlertIcon'
          density='compact'
          :text='loginAlertText'
          class='mb-5'
          v-if='loginAlertText'
        ></v-alert>
        <v-text-field
          :append-icon='showPassword ? "mdi-eye" : "mdi-eye-off"'
          label='パスワード'
          :type='showPassword ? "text" : "password"'
          v-model='roomPassword'
          @click:append='showPassword = !showPassword'
          @keydown.enter='roomLoginFunc(roomUuid)'
          :autofocus='true'
          @keydown.esc='loginDialog = false'
          ref='roomPasswordInput'
        >
          <template #label>
            <v-icon>mdi-lock</v-icon>
            パスワード
          </template>
        </v-text-field>
        <v-card-actions>
          <v-btn color='primary' variant='flat' @click='roomLoginFunc(roomUuid)' :loading='loading'>ログイン</v-btn>
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
          :type='loginAlertType'
          elevation='2'
          :icon='loginAlertIcon'
          density='compact'
          :text='loginAlertText'
          class='mb-5'
          v-if='loginAlertText'
        ></v-alert>
        <v-text-field
          prepend-icon='mdi-home-variant'
          v-model='createRoomName'
          append-icon='empty'
          label='部屋名'
          :autofocus='true'
          ref='roomNameInput'
        />
        <v-text-field
          prepend-icon='mdi-lock'
          :append-icon='showPassword ? "mdi-eye" : "mdi-eye-off"'
          label='パスワード'
          :type='showPassword ? "text" : "password"'
          v-model='roomPassword'
          @click:append='showPassword = !showPassword'
          @keydown.enter='roomLoginFunc()'
          ref='userPasswordInput'
        ></v-text-field>
        <v-card-actions>
          <v-btn
            color='primary'
            variant='flat'
            @click='roomLoginFunc()'
            :loading='loading'
            :disabled='!createRoomName'
            append-icon='mdi-shape-rectangle-plus'
          >新規登録
          </v-btn>
          <v-btn color='secondary' variant='flat' @click='createRoomDialog = false'>キャンセル</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
