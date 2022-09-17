<script setup lang='ts'>
import { provide } from 'vue'
import SessionStore, { InjectionKeySymbol as SessionKey } from '~/data/session'

provide(SessionKey, SessionStore())
</script>

<template>
  <v-app>
    <router-view />
    <template #fallback>
      loading
    </template>
  </v-app>
</template>

<!--suppress CssUnusedSymbol -->
<style>
html {
  overflow: auto !important;
}
</style>
