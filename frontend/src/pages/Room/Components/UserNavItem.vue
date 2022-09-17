<script setup lang='ts'>
defineProps<{
  label: string
  tooltipText: string
  appendIcon?: string
  prependIcon?: string
  value: string
  auto_play?: string
  showLabel: boolean
  listItemStyle?: string
}>()

const emits = defineEmits<{
  (e: 'click-list-item'): void
}>()
</script>

<template>
  <v-tooltip transition='scale-transition'>
    <template #activator='{ props }'>
      <v-list-item
        variant='elevated'
        color='primary'
        :value='value'
        v-bind='props'
        @click='emits("click-list-item")'
        :style='listItemStyle'
      >
        <template #append>
          <v-icon size='x-large' class='mr-2' v-if='appendIcon'>mdi-{{ appendIcon }}</v-icon>
        </template>
        <template #prepend>
          <v-icon size='x-large' class='mr-2' v-if='prependIcon'>mdi-{{ prependIcon }}</v-icon>
        </template>
        <transition name='fade'>
          <v-list-item-title class='pl-7' v-if='showLabel'>{{ label }}</v-list-item-title>
        </transition>
      </v-list-item>
    </template>
    <span class='font-weight-bold'>{{ tooltipText }}</span>
  </v-tooltip>
</template>

<!--suppress CssUnusedSymbol -->
<style lang='css'>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>