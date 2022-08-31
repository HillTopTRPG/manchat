<script setup lang='ts'>
import provideAll from '~/data/Play'
provideAll()

import Main from './Main.vue'

defineProps<{
  user_uuid: string;
}>()
</script>

<template>
  <Main :user_uuid='user_uuid' />
</template>
