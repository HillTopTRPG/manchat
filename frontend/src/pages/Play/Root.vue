<script setup lang='ts'>
import provideAll from '~/data/Play'

import Main from './Main.vue'

const props = defineProps<{
  room_uuid: string;
  user_uuid: string;
}>()

provideAll(props.room_uuid)
</script>

<template>
  <Main :room_uuid='room_uuid' :user_uuid='user_uuid' />
</template>
