<script setup lang='ts'>
import { Nav } from '~/pages/AccountHelper'
import { User } from '~/data/user'
import SplitPanesLayer from '~/components/SplitPanesLayer.vue'
import { Room } from '~/data/room'
import defaultLayout from './DefaultLayout'
import provideAll from '~/data/Play'

const props = defineProps<{
  room_uuid: string
  user_uuid: string
  nav1?: string | 'room-info'
  nav2: Nav
  users: User[]
  room: Room | null
  showBar: boolean
}>()

provideAll(props)
</script>

<template>
  <template v-if='nav2 !== "init"'>
    <split-panes-layer
      v-if='nav2 !== "entrance" && nav2 !== "init"'
      :layout='defaultLayout'
      :root-layout='defaultLayout'
      :show-bar='showBar'
    />
  </template>
</template>
