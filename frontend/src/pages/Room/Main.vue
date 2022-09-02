<script setup lang='ts'>
import { computed, inject, readonly, watch } from 'vue'

import { InjectionKeySymbol as roomKey, StoreType as RoomStore } from '~/data/room'
const roomState = inject(roomKey) as RoomStore

import { InjectionKeySymbol as userKey, StoreType as UserStore } from '~/data/user'
const userState = inject(userKey) as UserStore

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

import { ref } from 'vue'
const drawer = ref(false)
const drawer2 = ref(true)
const contentRef = ref()
const roomData = computed(() => roomState.state.rooms.find(r => r.uuid === props.room_uuid))

const selectedUser = ref<string[]>(props.user_uuid ? [props.user_uuid] : [])

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
</script>

<template>
  <v-layout>
    <v-app-bar prominent elevation='1' density='compact'>
      <v-app-bar-nav-icon variant='text' @click.stop='drawer = !drawer' :icon='drawer ? "mdi-chevron-right" : "mdi-chevron-left"'></v-app-bar-nav-icon>
      <v-avatar image='https://quoridorn.com/img/mascot/normal/mascot_normal.png' class='ml-3' />
      <v-toolbar-title>
        部屋
        <template v-if='roomData'>#{{ roomData?.id || '' }} - {{ roomData?.name || '' }}</template>
        <template v-if='userState.state.users.some(u => u.uuid === user_uuid)'> > {{ userState.state.users.find(u => u.uuid === user_uuid)?.name }}</template>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn variant='text' icon='mdi-brightness-6' @click='toggleTheme'></v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model='drawer2' :rail='drawer' rail-width='80' :permanent='true'>
      <v-list nav :selected='readonly(selectedUser)'>
        <v-list-item @click='gotoLobby'>
          <template #prepend>
            <v-icon size='x-large' class='mr-2'>mdi-home-group</v-icon>
          </template>
          <transition name='fade'>
            <v-list-item-title class='pl-7' v-if='!drawer'>ロビー</v-list-item-title>
          </transition>
        </v-list-item>

        <v-list-item @click='logout()' v-if='user_uuid'>
          <template #prepend>
            <v-icon size='x-large' class='mr-2'>mdi-logout-variant</v-icon>
          </template>
          <transition name='fade'>
            <v-list-item-title class='pl-7' v-if='!drawer'>ユーザーログアウト</v-list-item-title>
          </transition>
        </v-list-item>

        <v-divider />

        <v-list-subheader v-if='user_uuid'>{{ drawer ? 'User' : 'ユーザー' }}</v-list-subheader>
        <v-list-subheader v-else>{{ drawer ? 'Log in' : 'ユーザーログイン' }}</v-list-subheader>

        <v-list-item @click='contentRef.addUser()' v-if='!user_uuid'>
          <template #prepend>
            <v-icon size='x-large' class='mr-2'>mdi-login-variant</v-icon>
          </template>
          <transition name='fade'>
            <v-list-item-title class='pl-7' v-if='!drawer'>新しいユーザー</v-list-item-title>
          </transition>
        </v-list-item>

        <v-list-item
          v-for='user in userState.state.users'
          :key='user.uuid'
          :value='user.uuid'
          @click='contentRef.loginUser(user.uuid)'
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
          ref='contentRef'
        />
      </suspense>
    </v-main>
  </v-layout>
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
