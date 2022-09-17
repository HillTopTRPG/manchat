<script setup lang='ts'>
import { Nav } from '~/pages/AccountHelper'
import { User } from '~/data/user'
import NavRoomInfo from '~/pages/Room/NavContents/NavRoomInfo.vue'
import NavProfile from '~/pages/Room/NavContents/NavProfile.vue'
import NavNotification from '~/pages/Room/NavContents/NavNotification.vue'
import { Room } from '~/data/room'

const props = defineProps<{
  room_uuid: string
  user_uuid?: string
  user_name?: string
  user_password?: string
  auto_play?: string
  nav: Nav
  users: User[]
  room: Room | null
}>()
const emits = defineEmits<{
  (e: 'requireUserLogin'): void
  (e: 'logoutUser'): void
}>()
</script>

<template>
  <template v-if='nav !== "init"'>
    <nav-room-info v-bind='$props' @logout-user='emits("logoutUser")' />
    <nav-profile v-bind='$props' @require-user-login='emits("requireUserLogin")' />
    <nav-notification v-bind='$props' />
  </template>
</template>
