<script setup lang='ts'>
import SplitPanesLayer, { Layout } from '~/components/SplitPanesLayer.vue'

const props = defineProps<{
  user_uuid: string
  layout: Layout
}>()

import { useRouter } from 'vue-router'
const router = useRouter()

import { inject } from 'vue'
const axios = inject('axios') as any

let userToken = ''
await (async () => {
  let loggedIn = false
  const localStorageUserDataString = localStorage.getItem(props.user_uuid)
  if (localStorageUserDataString) {
    const { user_token, room_uuid, user_id } = JSON.parse(localStorageUserDataString)
    const localStorageRoomDataString = localStorage.getItem(room_uuid)
    const room_token = (localStorageRoomDataString ? JSON.parse(localStorageRoomDataString) : null)?.token
    userToken = user_token
    const result = await axios.post(`/api/v1/token/verify/users`, { room_uuid, user_uuid: props.user_uuid, user_token, room_token, })
    loggedIn = result.data.verify === 'success'
    if (!loggedIn) {
      const hasReason = (reason: string) => result.data.reasons.some((r: string) => r === reason)
      if (hasReason("different_room_uuid") || hasReason("not_found_room")) {
        router.replace({ name: 'lobby' }).then()
        return
      }
      const query: any = { r: result.data.room_id, u: result.data.user_id }
      if (hasReason("expired_room_token")) {
        router.replace({ name: 'lobby', query }).then()
        return
      }
      if (hasReason("not_found_user") || hasReason("expired_user_token")) {
        router.replace({ name: 'room', query, params: { room_uuid } }).then()
        return
      }
    }
  }

  if (!loggedIn) {
    const result = await axios.get(`/api/v1/users/u/${props.user_uuid}`)
    if (result.data) {
      const room_uuid = result.data.room_uuid
      const u = result.data.id
      router.replace({ name: 'room', params: { room_uuid }, query: { u } }).then()
    } else {
      router.replace({ name: 'lobby' }).then()
    }
  }
})()

import { ref } from 'vue'
const showBar = ref(false)
const isDrawerOpen = ref(true)
const isRail = ref(true)

const fgx = (val: number) => {
  console.log(val)
}
</script>

<template>
  <v-layout>
    <v-navigation-drawer
      v-model='isDrawerOpen'
      :rail='isRail'
      rail-width='55'
    >
      <v-list class='overflow-hidden' shaped>
        <v-list-item v-ripple :prepend-icon='isRail ? "mdi-chevron-right" : "mdi-chevron-left"' @click='isRail = !isRail' />
      </v-list>

      <v-divider />

      <v-list density='compact' nav class='overflow-hidden' rounded>
        <v-list-item v-ripple prepend-icon='mdi-folder' title='My Files' @click='fgx(111)'></v-list-item>
        <v-list-item v-ripple prepend-icon='mdi-account-multiple' title='Shared with me' @click='fgx(222)'></v-list-item>
        <v-list-item v-ripple prepend-icon='mdi-star' title='Starred' @click='fgx(333)'></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      color='teal-darken-4'
      image='https://picsum.photos/1920/1080?random'
      :title='`Room: ${user_uuid}`'
    >
      <template #image>
        <v-img gradient='to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)'></v-img>
      </template>

      <v-spacer />

      <v-btn size='small' icon='mdi-pencil-ruler' @click='showBar = !showBar'></v-btn>
      <v-btn icon='mdi-dots-vertical' />
    </v-app-bar>

    <v-main>
      <split-panes-layer :layout='layout' :root-layout='layout' :show-bar='showBar' />
    </v-main>
  </v-layout>
</template>
