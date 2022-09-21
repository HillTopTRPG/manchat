<script setup lang='ts'>
import { computed } from 'vue'
import Avatar from 'vue-boring-avatars';

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
      return 'mdi-crown'
    case 'visitor':
      return 'mdi-eye'
    default:
      return 'empty'
  }
})

const colors = ['#92a1c6', '#146a7c', '#f0ab3d', '#c271b4', '#c20d90']
</script>

<template>
  <v-badge
    class='login-status'
    :bordered='true'
    :color='user?.log_in_count ? "green-darken-1" : "grey-darken-1"'
    location='right bottom'
    icon='mdi-circle'
  >
    <template #badge>
      <span class='text-black' v-if='!user?.log_in_count'>●</span>
      <template v-else-if='user?.log_in_count > 1'>{{ user?.log_in_count }}</template>
    </template>
    <v-badge
      class='absolute-color'
      :class='user.user_type'
      location='right top'
      :icon='icon'
      color='white'
    >
      <Avatar variant='beam' :size='40' :name='user.uuid' :colors='colors' />
    </v-badge>
  </v-badge>
</template>

<!--suppress CssUnusedSymbol, HtmlUnknownAttribute, CssUnresolvedCustomProperty -->
<style deep lang='css'>
.v-badge__badge {
  user-select: none;
  display: flex;
  justify-content: center;
  align-items: center;
}

.v-badge__badge::after {
  transform: none !important;
}

.v-badge.player > .v-badge__wrapper > .v-badge__badge {
  visibility: hidden;
}

.v-badge.absolute-color > .v-badge__wrapper > .v-badge__badge {
  background: rgb(var(--v-code-background-color)) !important;
  box-sizing: border-box;
}

.v-badge.absolute-color > .v-badge__wrapper > .v-badge__badge::after {
  color: rgb(var(--v-theme-surface)) !important;
}

.v-badge.login-status > .v-badge__wrapper > .v-badge__badge > * {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
