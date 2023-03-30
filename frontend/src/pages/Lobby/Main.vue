<script setup lang='ts'>
import { InjectionKeySymbol as roomKey, StoreType as RoomStore } from '~/data/room'
import { inject, ref } from 'vue'
import Contents from '~/pages/Lobby/Contents.vue'

import { useTheme } from 'vuetify'

const roomState = inject(roomKey) as RoomStore

defineProps<{
  room_uuid?: string
  user_uuid?: string
  user_name?: string
  user_password?: string
}>()

const theme             = useTheme()
theme.global.name.value = localStorage.getItem('view.theme') || 'light'
const toggleTheme       = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  localStorage.setItem('view.theme', theme.global.name.value)
}

const drawer     = ref(false)
const contentRef = ref()
</script>

<template>
  <v-layout class='lobby'>
    <v-navigation-drawer v-model='drawer' :temporary='true'>
      <v-list>
        <v-list-item class='px-2 py-0'>
          <template #prepend>
            <v-btn icon='mdi-menu' elevation='0' @click='drawer = false'></v-btn>
          </template>
          <v-avatar image='https://quoridorn.com/img/mascot/normal/mascot_normal.png' class='ml-3' />
        </v-list-item>
      </v-list>
      <v-list density='compact'>
        <v-list-subheader>お気に入り</v-list-subheader>
        <template v-for='favoriteRoomUuid in roomState.state.favoriteRooms' :key='favoriteRoomUuid'>
          <v-list-item
            class='px-2 py-0'
            :disabled='!roomState.state.rooms.some(r => r.uuid === favoriteRoomUuid)'
            :value='`favorite-${favoriteRoomUuid}`'
            @click='contentRef.login(favoriteRoomUuid)'
          >
            <template #prepend>
              <v-icon
                color='accent'
                class='ml-3 mr-1'
                :icon='roomState.state.rooms.some(r => r.uuid === favoriteRoomUuid) ? "mdi-folder-home" : "mdi-home-alert"'
              ></v-icon>
            </template>
            <v-list-item-title>
              #{{ roomState.state.rooms.find(r => r.uuid === favoriteRoomUuid)?.id }} {{
                roomState.state.rooms.find(r => r.uuid === favoriteRoomUuid)?.name
              }}
            </v-list-item-title>
          </v-list-item>
        </template>
        <v-list-item prepend-icon='empty' v-if='roomState.state.favoriteRooms.length === 0'>なし</v-list-item>
        <v-divider class='my-2' />
        <v-list-subheader>過去に入室した部屋</v-list-subheader>
        <template v-for='loggedInRoomUuid in roomState.state.loggedInRooms' :key='loggedInRoomUuid'>
          <v-list-item
            class='px-2 py-0'
            :disabled='!roomState.state.rooms.some(r => r.uuid === loggedInRoomUuid)'
            :value='`logged-in-${loggedInRoomUuid}`'
            @click='contentRef.login(loggedInRoomUuid)'
          >
            <template #prepend>
              <v-icon
                color='accent'
                class='ml-3 mr-1'
                :icon='roomState.state.rooms.some(r => r.uuid === loggedInRoomUuid) ? "mdi-folder-home" : "mdi-home-alert"'
              ></v-icon>
            </template>
            <v-list-item-title>
              #{{
                roomState.state.rooms.find(r => r.uuid === loggedInRoomUuid)?.id
              }} {{ roomState.state.rooms.find(r => r.uuid === loggedInRoomUuid)?.name }}
            </v-list-item-title>
          </v-list-item>
        </template>
        <v-list-item prepend-icon='empty' v-if='roomState.state.loggedInRooms.length === 0'>なし</v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar prominent elevation='1' density='compact'>
      <v-app-bar-nav-icon variant='text' @click.stop='drawer = !drawer'></v-app-bar-nav-icon>

      <v-avatar image='https://quoridorn.com/img/mascot/normal/mascot_normal.png' class='ml-3' />
      <v-toolbar-title>ロビー</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn variant='text' icon='mdi-brightness-6' @click='toggleTheme'></v-btn>
    </v-app-bar>
    <v-main>
      <Contents
        :room_uuid='room_uuid'
        :user_uuid='user_uuid'
        :user_name='user_name'
        :user_password='user_password'
        ref='contentRef'
      />
    </v-main>
  </v-layout>
</template>
