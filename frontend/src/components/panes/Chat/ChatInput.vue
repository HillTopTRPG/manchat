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
import { InjectionKeySymbol as collectionsKey, StoreType as CollectionsStore } from '~/data/RoomCollections'

const store      = inject(collectionsKey) as CollectionsStore
const axios: any = inject('axios')

const raw      = ref('')
const sendChat = (e: { target: HTMLTextAreaElement, shiftKey: boolean }) => {
  console.log(e)
  if (e.shiftKey) {
    raw.value += '\n'
    return
  }
  store.sendChat({
                   tab            : null,
                   raw            : raw.value,
                   owner_character: null,
                   target_type    : null,
                   target_uuid    : null,
                   secret         : 0,
                   axios,
                 })
  raw.value = ''
}
</script>

<template>
  <v-card class='w-100 h-100'>
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
.v-card {
  border-radius: 0;
}

.chat-input .v-input__control textarea,
.chat-input .v-input__control {
  height: 100%;
  width: 100%;
  position: absolute;
}
</style>