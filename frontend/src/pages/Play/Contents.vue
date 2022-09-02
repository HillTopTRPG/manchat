<script setup lang='ts'>
import SplitPanesLayer, { Layout } from '~/components/SplitPanesLayer.vue'

const props = defineProps<{
  room_uuid: string;
  user_uuid: string;
  layout: Layout;
}>()

import { useRouter } from 'vue-router'
const router = useRouter()

import { inject } from 'vue'
const axios = inject('axios') as any

await (async () => {
  const { room_token } = JSON.parse(localStorage.getItem(props.room_uuid) || '{}')
  const toLobbyQuery = { r: props.room_uuid, u: props.user_uuid, auto_play: 1, }
  if (!room_token) {
    // 部屋トークンが取得できない状況はロビーに戻す
    router.replace({ name: 'lobby', query: toLobbyQuery, }).then()
    return
  }
  const { data: roomsData } = await axios.post(`/api/v1/rooms/${props.room_uuid}/token/${room_token}/check`)
  console.log(JSON.stringify(roomsData, null, '  '))
  if (roomsData.verify !== 'success') {
    router.replace({ name: 'lobby', query: roomsData.reason === 'no_such_room' ? undefined : toLobbyQuery, }).then()
    return
  }

  const { user_token } = JSON.parse(localStorage.getItem(props.user_uuid) || '{}')
  if (!user_token) {
    // ユーザートークンが取得できない状況は部屋に戻す
    router.replace({ name: 'room', params: { room_uuid: props.room_uuid }, query: { u: props.user_uuid, auto_play: 1, } }).then()
    return
  }
  const { data: usersData } = await axios.post(
    `/api/v1/users/${props.user_uuid}/token/${user_token}/check`,
    { room_uuid: props.room_uuid, room_token, }
  )
  console.log(JSON.stringify(usersData, null, '  '))
  if (usersData.verify !== 'success') {
    const hasReason = (reason: string) => usersData.reasons.some((r: string) => r === reason)
    if (hasReason('different_room_uuid') || hasReason('no_such_room')) {
      router.replace({ name: 'lobby' }).then()
    } else if (hasReason('expired_room_token')) {
      router.replace({ name: 'lobby', query: { r: props.room_uuid, u: props.user_uuid, auto_play: 1, }, }).then()
    } else if (hasReason('no_such_user')) {
      router.replace({ name: 'room', params: { room_uuid: props.room_uuid, }, }).then()
    } else if (hasReason('expired_user_token')) {
      router.replace({
        name: 'room-user',
        params: { room_uuid: props.room_uuid, user_uuid: props.user_uuid, },
        query: { auto_play: 1 }
      }).then()
    } else {
      router.replace({ name: 'room', params: { room_uuid: props.room_uuid, }, query: { u: props.user_uuid, auto_play: 1, } }).then()
    }
    return
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
        <v-list-item
          v-ripple
          :prepend-icon='isRail ? "mdi-chevron-right" : "mdi-chevron-left"'
          @click='isRail = !isRail'
        />
      </v-list>

      <v-divider />

      <v-list density='compact' nav class='overflow-hidden' rounded>
        <v-list-item v-ripple prepend-icon='mdi-folder' title='My Files' @click='fgx(111)' />
        <v-list-item v-ripple prepend-icon='mdi-account-multiple' title='Shared with me' @click='fgx(222)' />
        <v-list-item v-ripple prepend-icon='mdi-star' title='Starred' @click='fgx(333)' />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      color='teal-darken-4'
      image='https://picsum.photos/1920/1080?random'
      :title='`Room: ${user_uuid}`'
      elevation='1'
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
