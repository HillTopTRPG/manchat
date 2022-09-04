<script setup lang='ts'>
import Contents from './Contents.vue'
import defaultLayout from './DefaultLayout'
import { useTheme } from 'vuetify'

defineProps<{
  room_uuid: string
  user_uuid: string
}>()

const theme             = useTheme()
theme.global.name.value = localStorage.getItem('view.theme') || 'light'

// TODO use
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  localStorage.setItem('view.theme', theme.global.name.value)
}
</script>

<template>
  <suspense>
    <Contents :layout='defaultLayout' :room_uuid='room_uuid' :user_uuid='user_uuid' />
  </suspense>
</template>
