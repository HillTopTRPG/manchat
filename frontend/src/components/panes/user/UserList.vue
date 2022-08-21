<script lang="ts">
import { defineComponent } from "@vue/runtime-core";
export default defineComponent({});
export const labelStr = "ユーザー一覧"
</script>

<script setup lang="ts">
import {inject} from "vue";
import {InjectionKeySymbol as countKey, Store as countStore} from "~/data/count"
const {state, increment, decrement} = inject(countKey) as countStore
</script>

<template>
  <v-card
    class="mx-auto"
  >
    {{state.count}}
  </v-card>
  <v-btn @click="increment">+</v-btn>
  <v-btn @click="decrement">-</v-btn>
</template>
