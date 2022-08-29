<script setup lang='ts'>
import Main from '~/pages/Room/Main.vue'

defineProps<{
  room_uuid: string;
  user_id?: string;
  user_name?: string;
  user_password?: string;
}>()
</script>

<template>
  <Main :room_uuid='room_uuid' :user_id='user_id' :user_name='user_name' :user_password='user_password' />
</template>
