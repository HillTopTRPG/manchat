<script setup lang='ts'>
defineProps<{
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
</script>

<template>
  <v-badge :bordered='true' color='text-grey-darken-3' location='right bottom' icon='mdi-circle'>
    <template #badge>
      <v-icon class='text-grey-darken-5'>mdi-circle</v-icon>
    </template>
    <v-badge
      :color='user.user_type === "master" ? "yellow-accent-3" : "gray-accent-3"'
      location='left top'
      v-if='user && (user.user_type === "master" || user.user_type === "visitor")'
    >
      <template #badge>
        <v-icon v-if='user.user_type === "master"'>mdi-movie-open</v-icon>
        <v-icon v-if='user.user_type === "visitor"'>mdi-eye</v-icon>
      </template>
      <v-icon class='pa-5 bg-cyan-accent-1' size='x-large' style='border-radius: 50%'>mdi-account</v-icon>
    </v-badge>
    <v-icon
      v-else
      class='pa-5 bg-cyan-accent-1'
      size='x-large'
      style='border-radius: 50%'
    >mdi-account
    </v-icon>
  </v-badge>
</template>
