<script lang='ts'>
import { defineComponent } from '@vue/runtime-core'

export default defineComponent({})
//noinspection JSUnusedGlobalSymbols
export const componentInfo = {
  name : 'ChatInput',
  label: 'チャット入力欄',
}
</script>

<script setup lang='ts'>
import { inject, ref } from 'vue'
import {
  InjectionKeySymbol as collectionsKey, StoreType as CollectionsStore,
} from '~/data/RoomCollections'
import { InjectionKeySymbol as sessionKey, StoreType as SessionStore } from '~/data/session'
import { Layout } from '~/components/panes'

const props = defineProps<{
  layout: Layout
  rootLayout: Layout
}>()

const store        = inject(collectionsKey) as CollectionsStore
const sessionStore = inject(sessionKey) as SessionStore

const axios: any = inject('axios')

const raw      = ref('')
const sendChat = (e: { target: HTMLTextAreaElement, shiftKey: boolean }) => {
  console.log(e)
  if (e.shiftKey) {
    raw.value += '\n'
    return
  }

  const nav1         = sessionStore.nav1.value
  const getTargetVal = (val: string | null) => nav1 === 'room-info' || nav1 === sessionStore.user_uuid.value
                                               ? null
                                               : store.users.value.some(u => u.uuid === nav1) ? val : null

  store.sendChat({
                   tab            : null,
                   raw            : raw.value,
                   owner_character: null,
                   target_type    : getTargetVal('user'),
                   target_uuid    : getTargetVal(nav1 || null),
                   secret         : 0,
                   axios,
                 })
  raw.value = ''
}
</script>

<template>
  <v-card class='chat-input-container w-100 h-100'>
    <v-textarea
      class='chat-input w-100 h-100'
      v-model='raw'
      @keydown.enter.prevent.stop='sendChat'
      :hide-details='true'
      label='チャット入力欄'
      :no-resize='true'
    ></v-textarea>
  </v-card>
</template>

<!--suppress HtmlUnknownAttribute -->
<style deep lang='css'>
.v-card.chat-input-container {
  border-radius: 0;
  background: transparent !important;
}

.chat-input .v-input__control textarea,
.chat-input .v-input__control {
  height: 100%;
  width: 100%;
  position: absolute;
}
</style>