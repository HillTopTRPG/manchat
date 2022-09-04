<script setup lang='ts'>
import Main from '~/pages/Room/Main.vue'

defineProps<{
  room_uuid: string
  user_uuid?: string
  user_name?: string
  user_password?: string
  auto_play?: string
}>()
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
