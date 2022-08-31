<script lang="ts">
import { defineComponent } from "@vue/runtime-core";
export default defineComponent({});
export const labelStr = "ユーザー一覧"
</script>

<script setup lang="ts">
import {inject} from "vue";
import {InjectionKeySymbol as countKey, StoreType as CountStore} from "~/data/count"
import {InjectionKeySymbol as userKey, StoreType as UserStore} from "~/data/user"
const counterState = inject(countKey) as CountStore
const userState = inject(userKey) as UserStore
</script>

<template>
  <v-card
    class="mx-auto"
  >
    <pre style="display: block"><code>{{ JSON.stringify(userState.state.users, null, "  ") }}</code></pre>
    <span>{{counterState.state.count}}</span>
  </v-card>
  <v-text-field @keydown.enter="userState.speak($event.target.value);$event.target.value = ''" />
  <v-btn @click="counterState.increment">+</v-btn>
  <v-btn @click="counterState.decrement">-</v-btn>
</template>
