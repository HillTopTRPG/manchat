<script lang="ts">
import { defineComponent } from "@vue/runtime-core";
export default defineComponent({});
export const labelStr = "ユーザー一覧"
</script>

<script setup lang="ts">
import {inject} from "vue";
import {InjectionKeySymbol as countKey, Store as countStore} from "~/data/count"
import {InjectionKeySymbol as userKey, Store as userStore} from "~/data/user"
const counterState = inject(countKey) as countStore
const userState = inject(userKey) as userStore
</script>

<template>
  <v-card
    class="mx-auto"
  >
    <pre style="display: block"><code>{{ JSON.stringify(userState.state.json, null, "  ") }}</code></pre>
    <span>{{counterState.state.count}}</span>
  </v-card>
  <v-btn @click="counterState.increment">+</v-btn>
  <v-btn @click="counterState.decrement">-</v-btn>
</template>
