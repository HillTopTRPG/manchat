<script setup lang='ts'>
import { Nav } from '~/pages/AccountHelper'
import { User } from '~/data/user'
import { Room } from '~/data/room'
import provideAll from '~/data/Play'
import ChatOverlay from '~/pages/Room/ChatOverlay.vue'

const props = defineProps<{
  room_uuid: string
  user_uuid: string
  nav1?: string | 'room-info'
  nav2: Nav
  users: User[]
  room: Room | null
  showBar: boolean
}>()

provideAll(props)
</script>

<template>
  <template v-if='nav2 !== "init"'>
    <ChatOverlay />
  </template>
</template>
