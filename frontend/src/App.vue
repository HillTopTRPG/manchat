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
<style lang='css'>
html {
  overflow: auto !important;
}

*::-webkit-scrollbar {
  width: 5px;
  background: white;
}

*::-webkit-scrollbar-corner,
*::-webkit-scrollbar-track {
  background-color: rgb(var(--v-theme-surface));
  box-shadow: inset 0 0 1px rgba(180, 160, 120, 0.2);
}

*::-webkit-scrollbar-thumb {
  width: 4px;
  background-color: #8070d4;
  border-radius: 5px;
  box-shadow: inset 3px 3px 3px rgba(0, 0, 0, 0.2);
}
</style>
