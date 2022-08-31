<script setup lang='ts'>
import Main from '~/pages/Room/Main.vue'
import UserStore, { InjectionKeySymbol as UserKey } from '~/data/user'
import RoomStore, { InjectionKeySymbol as RoomKey } from '~/data/room'
import { provide } from 'vue'

const props = defineProps<{
  room_uuid: string;
  user_uuid?: string;
  user_name?: string;
  user_password?: string;
  auto_play?: number;
}>()

provide(UserKey, UserStore(props.room_uuid))
provide(RoomKey, RoomStore())
</script>

<template>
  <Main
    :room_uuid='room_uuid'
    :user_uuid='user_uuid'
    :user_name='user_name'
    :user_password='user_password'
    :auto_play='auto_play'
  />
</template>
