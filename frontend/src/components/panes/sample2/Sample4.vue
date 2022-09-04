<script lang='ts'>
import { defineComponent } from '@vue/runtime-core'

export default defineComponent({})
//noinspection JSUnusedGlobalSymbols
export const labelStr = 'サンプルペイン4'
</script>

<script setup lang='ts'>
import { ref } from 'vue'

const textValue = ref('')
</script>

<template>
  <v-text-field v-model='textValue' placeholder='sample4' />
</template>
