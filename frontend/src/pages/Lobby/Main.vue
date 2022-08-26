<script setup lang="ts">
import provideAll from "~/data/Lobby"
provideAll()

import Contents from "~/pages/Lobby/Contents.vue"
import {ref} from "vue";
import { useTheme } from 'vuetify'
const theme = useTheme()

const toggleTheme = () => theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'

const drawer = ref(false)
</script>

<template>
  <v-layout>

    <v-navigation-drawer
      v-model="drawer"
      temporary
    >
      <v-list>
        <v-list-item class="px-2 py-0">
          <template v-slot:prepend>
            <v-btn icon="mdi-menu" elevation="0" @click="drawer = false"></v-btn>
          </template>
          <v-avatar image="https://quoridorn.com/img/mascot/normal/mascot_normal.png" class="ml-3" />
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar prominent elevation="0">
      <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

      <v-avatar image="https://quoridorn.com/img/mascot/normal/mascot_normal.png" class="ml-3" />
      <v-toolbar-title>ロビー</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn variant="text" icon="mdi-brightness-6" @click="toggleTheme"></v-btn>
    </v-app-bar>
    <v-main>
      <contents />
    </v-main>
  </v-layout>
</template>
