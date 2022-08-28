<template>
  <v-app>
    <router-view />
    <template #fallback>
      loading
    </template>
  </v-app>
</template>

<style>
html {
  overflow: auto !important;
}
</style>
