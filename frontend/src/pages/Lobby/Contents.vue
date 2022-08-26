<script setup lang="ts">
import {InjectionKeySymbol as roomKey, StoreType as RoomStore} from "~/data/room"
import {computed, inject, ref} from "vue"
import { useRouter } from 'vue-router'
const roomState = inject(roomKey) as RoomStore
const axios = inject("axios") as any
const router = useRouter()

const loginDialog = ref(false)
const createRoomDialog = ref(false)
const loginDialogType = ref<"room" | "user">("room")
const roomShowPassword = ref(false)
const roomPassword = ref("")
const roomUuid = ref("")
const userName = ref("")
const createRoomName = ref("")
const users = ref<any[]>([])
const loginRoomId = ref(0)
const selectedRoomName = computed(() => roomState.state.rooms.find(r => r.id === loginRoomId.value)?.name || null)
const isExistsUser = computed(() => users.value.some(u => u.name === userName.value))
const userUuid = ref("")
const userPassword = ref("")
const userShowPassword = ref(false)
const loading = ref(false)
const loginResult = ref("")
const roomPasswordInput = ref<HTMLInputElement>()
const userPasswordInput = ref<HTMLInputElement>()

const showCreateRoom = () => {
  loginResult.value = ""
  createRoomName.value = ""
  roomPassword.value = ""
  createRoomDialog.value = true
  loading.value = false
}

const showRoomLogin = (id: number) => {
  loginResult.value = ""
  roomPassword.value = ""
  loginDialogType.value = "room"
  loginDialog.value = true
  loginRoomId.value = id
  loading.value = false
  users.value = []
}

const createRoom = async () => {
  createRoomDialog.value = false
  const result = await axios.post(`/api/v1/rooms.json`, {
    api_v1_room: {
      name: createRoomName.value,
      password: roomPassword.value,
    }
  })
}

const roomLogin = async () => {
  loading.value = true
  loginResult.value = ""
  const result = await axios.post(`/api/v1/rooms/${loginRoomId.value}/verify`, { password: roomPassword.value })
  const verified = result.data.verify === "success"
  roomUuid.value = verified ? result.data.uuid : ""
  users.value = verified ? result.data.users : []
  loading.value = false
  if (!verified) {
    loginResult.value = "部屋パスワードが違います"
    roomPasswordInput.value?.select()
  } else {
    loginDialogType.value = "user"
  }
}

const userLogin = async () => {
  loading.value = true
  loginResult.value = ""
  userUuid.value = ""
  const existsUser = users.value.find(u => u.name === userName.value) || null
  if (existsUser) {
    // sign in
    const result = await axios.post(`/api/v1/users/${existsUser.id}/verify`, { password: userPassword.value })
    const verified = result.data.verify === "success"
    userUuid.value = verified ? result.data.uuid : ""
    loading.value = false
    if (!verified) {
      loginResult.value = "ユーザーパスワードが違います"
      userPasswordInput.value?.select()
    }
  } else {
    // sign up
    const result = await axios.post(`/api/v1/users.json`, {
      api_v1_user: {
        name: userName.value,
        password: userPassword.value,
        room_uuid: roomUuid.value,
      }
    })
    userUuid.value = result.data.uuid
  }
  await router.push(userUuid.value)
}
</script>

<template>
  <v-container class="h-100">
    <v-row no-gutters>
      <v-switch true-icon="mdi-sync-circle" label="自動同期" color="primary" :inset="false" v-model="roomState.state.autoSynchronize" density="compact" />
    </v-row>
    <v-row no-gutters>
      <v-col>
        <v-card class="overflow-auto" max-height="100%">
          <v-table :fixed-header="true" height="calc(100vh - 152px)">
            <thead>
            <tr>
              <th class="text-right">#</th>
              <th class="text-left" style="width: 100%">部屋名</th>
              <th class="text-left text-right">
                <v-btn append-icon="mdi-shape-rectangle-plus" color="primary" @click="showCreateRoom">新規作成</v-btn>
              </th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="room in roomState.state.rooms" :key="room.uuid">
              <td class="text-right">{{ room.id }}</td>
              <td>
                <v-card elevation="0" variant="text" class="mb-2">
                  <v-card-title>{{room.name}}</v-card-title>
                  <v-card-subtitle>最終ログイン: {{ $d(room.last_logged_in, 'long') }}</v-card-subtitle>
                </v-card>
              </td>
              <td class="text-right">
                <v-btn append-icon="mdi-login" color="secondary" @click="showRoomLogin(room.id)">入室</v-btn>
              </td>
            </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  <v-dialog :model-value="loginDialog">
    <v-card class="mx-auto mt-5 pa-3">
      <v-card-title v-text="`#${loginRoomId} ${selectedRoomName}`" />
      <v-card-subtitle v-text="loginDialogType === 'room' ? '入室' : 'ユーザーログイン'" />
      <v-card-text>
        <v-alert
          colored-border
          type="error"
          elevation="2"
          icon="$info"
          density="compact"
          :text="loginResult"
          class="mb-5"
          :style="{visibility: loginResult ? 'visible' : 'hidden'}"
        ></v-alert>
        <template v-if="loginDialogType === 'room'">
          <v-text-field
            :append-icon="roomShowPassword ? 'mdi-eye' : 'mdi-eye-off'"
            label="パスワード"
            :type="roomShowPassword ? 'text' : 'password'"
            v-model="roomPassword"
            @click:append="roomShowPassword = !roomShowPassword"
            @keydown.enter="roomLogin"
            :autofocus="true"
            @keydown.esc="loginDialog = false"
            ref="roomPasswordInput"
          >
            <template v-slot:label>
              <v-icon icon="mdi-lock"></v-icon>パスワード
            </template>
          </v-text-field>
          <v-card-actions>
            <v-btn color="primary" variant="flat" @click="roomLogin" :loading="loading">ログイン</v-btn>
            <v-btn color="secondary" variant="flat" @click="loginDialog = false">キャンセル</v-btn>
          </v-card-actions>
        </template>
        <template v-if="loginDialogType === 'user'">
          <v-combobox
            :items="users"
            item-title="name"
            item-value="name"
            v-model="userName"
            append-icon="empty"
            :autofocus="true"
            @keydown.esc="loginDialog = false"
          >
            <template v-slot:label>
              <v-icon icon="mdi-account-circle"></v-icon>ユーザー名
            </template>
          </v-combobox>
          <v-text-field
            :append-icon="userShowPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="userShowPassword ? 'text' : 'password'"
            v-model="userPassword"
            @click:append="userShowPassword = !userShowPassword"
            @keydown.enter="userLogin"
            @keydown.esc="loginDialog = false"
            ref="userPasswordInput"
          >
            <template v-slot:label>
              <v-icon icon="mdi-lock"></v-icon>パスワード
            </template>
          </v-text-field>
          <v-card-actions>
            <v-btn color="primary" variant="flat" @click="userLogin" :loading="loading" :disabled="!userName" :append-icon="isExistsUser ? 'mdi-login' : 'mdi-account-plus'">{{isExistsUser ? 'ログイン' : '新規登録'}}</v-btn>
            <v-btn color="secondary" variant="flat" @click="loginDialog = false">キャンセル</v-btn>
          </v-card-actions>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
  <v-dialog :model-value="createRoomDialog">
    <v-card class="mx-auto mt-5 pa-3">
      <v-card-title v-text="'部屋ログイン'" />
      <v-card-text>
        <v-alert
          colored-border
          type="error"
          elevation="2"
          icon="$info"
          density="compact"
          :text="loginResult"
          class="mb-5"
          :style="{visibility: loginResult ? 'visible' : 'hidden'}"
        ></v-alert>
        <v-text-field prepend-icon="mdi-home-variant" v-model="createRoomName" append-icon="empty" label="部屋名" :autofocus="true"></v-text-field>
        <v-text-field
          prepend-icon="mdi-lock"
          :append-icon="roomShowPassword ? 'mdi-eye' : 'mdi-eye-off'"
          label="パスワード"
          :type="roomShowPassword ? 'text' : 'password'"
          v-model="roomPassword"
          @click:append="roomShowPassword = !roomShowPassword"
          @keydown.enter="createRoom"
          ref="userPasswordInput"
        ></v-text-field>
        <v-card-actions>
          <v-btn color="primary" variant="flat" @click="createRoom" :loading="loading" :disabled="!createRoomName" append-icon="mdi-shape-rectangle-plus">新規登録</v-btn>
          <v-btn color="secondary" variant="flat" @click="createRoomDialog = false">キャンセル</v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style deep lang="css">
.v-table .v-card-title,
.v-table .v-card-subtitle,
.v-table .v-card-item {
  padding-left: 0;
  padding-right: 0;
}
</style>