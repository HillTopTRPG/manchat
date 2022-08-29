<script setup lang='ts'>
import provideAll from '~/data/Lobby'
provideAll()

import Main from '~/pages/Lobby/Main.vue'

defineProps<{
  room_id?: string;
  user_id?: string;
  user_name?: string;
  user_password?: string;
}>()
</script>

<template>
  <Main :room_id='room_id' :user_id='user_id' :user_name='user_name' :user_password='user_password' />
</template>
