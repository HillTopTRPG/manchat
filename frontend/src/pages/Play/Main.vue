<script setup lang="ts">
import provideAll from "~/data/Play"
provideAll()

import Contents from "./Contents.vue"
import defaultLayout from "./DefaultLayout";

interface Props {
  user_uuid: string
}
defineProps<Props>()

import { useTheme } from 'vuetify'
const theme = useTheme()
theme.global.name.value = localStorage.getItem('view.theme') || 'light'
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  localStorage.setItem('view.theme', theme.global.name.value)
}
</script>

<template>
  <Contents :layout="defaultLayout" :user_uuid="user_uuid" />
</template>
