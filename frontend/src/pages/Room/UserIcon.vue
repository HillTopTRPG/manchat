<script setup lang='ts'>
import { computed } from 'vue'

const props = defineProps<{
  user?: {
    id: number
    uuid: string
    name: string
    user_type: string
    room_uuid: string
    log_in_count: number
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
  <v-badge
    :bordered='true'
    :color='user?.log_in_count ? "green-darken-1" : "grey-darken-1"'
    location='right bottom'
    icon='mdi-circle'
  >
    <template #badge>
      <span class='text-black' v-if='!user?.log_in_count'>●</span>
      <template v-else-if='user?.log_in_count > 1'>{{ user?.log_in_count }}</template>
    </template>
    <v-icon
      class='pa-5 border-solid'
      size='x-large'
      style='border-radius: 50%; border-width: 3px;'
      :icon='icon'
    />
  </v-badge>
</template>
