<script setup lang='ts'>
const props = defineProps<{
  room_uuid: string
}>()

import { inject } from 'vue'
const axios = inject('axios') as any

const result = await axios.get(`/api/v1/rooms/u/${props.room_uuid}`)
let roomId = ''
let roomName = ''
if (result.data) {
  roomId = result.data.id
  roomName = result.data.name
}
</script>

<template>
  #{{roomId}} - {{roomName}}
</template>
