<script setup lang='ts'>
import { computed } from 'vue'

const props = defineProps<{
  user?: {
    id: number
    uuid: string
    name: string
    user_type: string
    room_uuid: string
    last_logged_in: Date
    created_at: Date
    updated_at: Date
  }
}>()

const icon = computed(() => {
  switch (props.user?.user_type) {
    case 'master':
      return 'mdi-movie-open'
    case 'player':
      return 'mdi-account'
    case 'visitor':
      return 'mdi-eye'
    default:
      return 'empty'
  }
})
</script>

<template>
  <v-badge :bordered='true' color='text-grey-darken-3' location='right bottom' icon='mdi-circle'>
    <template #badge>
      <v-icon class='text-grey-darken-5'>mdi-circle</v-icon>
    </template>
    <v-icon
      class='pa-5 bg-cyan-accent-1'
      size='x-large'
      style='border-radius: 50%'
      :icon='icon'
    >
    </v-icon>
  </v-badge>
</template>
