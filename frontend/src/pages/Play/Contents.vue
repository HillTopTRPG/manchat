<script setup lang='ts'>
import SplitPanesLayer, { Layout } from '~/components/SplitPanesLayer.vue'

defineProps<{
  user_uuid: string
  layout: Layout
}>()

import { ref } from 'vue'
const showBar = ref(false)
const isDrawerOpen = ref(true)
const isRail = ref(true)

const fgx = (val: number) => {
  console.log(val)
}
</script>

<template>
  <v-layout>
    <v-navigation-drawer
      v-model='isDrawerOpen'
      :rail='isRail'
      rail-width='55'
    >
      <v-list class='overflow-hidden' shaped>
        <v-list-item v-ripple :prepend-icon='isRail ? "mdi-chevron-right" : "mdi-chevron-left"' @click='isRail = !isRail' />
      </v-list>

      <v-divider />

      <v-list density='compact' nav class='overflow-hidden' rounded>
        <v-list-item v-ripple prepend-icon='mdi-folder' title='My Files' @click='fgx(111)'></v-list-item>
        <v-list-item v-ripple prepend-icon='mdi-account-multiple' title='Shared with me' @click='fgx(222)'></v-list-item>
        <v-list-item v-ripple prepend-icon='mdi-star' title='Starred' @click='fgx(333)'></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      color='teal-darken-4'
      image='https://picsum.photos/1920/1080?random'
      :title='`Room: ${user_uuid}`'
    >
      <template #image>
        <v-img gradient='to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)'></v-img>
      </template>

      <v-spacer />

      <v-btn size='small' icon='mdi-pencil-ruler' @click='showBar = !showBar'></v-btn>
      <v-btn icon='mdi-dots-vertical' />
    </v-app-bar>

    <v-main>
      <split-panes-layer :layout='layout' :root-layout='layout' :show-bar='showBar' />
    </v-main>
  </v-layout>
</template>
