<script setup lang='ts'>
import { computed, onMounted, ref } from 'vue'
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

const avatar = ref<any>()

onMounted(() => {
  // 抑止できなかったtitle要素を削除（マウスオーバーでuuidが表示されてしまうのを防ぐ）
  const svg = avatar.value.$el
  svg.removeChild(svg.getElementsByTagName('title')[0])
})

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
    class='absolute-color'
    :class='user.user_type'
    location='right top'
    :icon='icon'
    color='white'
  >
    <Avatar variant='beam' :size='40' :name='user.uuid' :colors='colors' ref='avatar' />
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
</style>
