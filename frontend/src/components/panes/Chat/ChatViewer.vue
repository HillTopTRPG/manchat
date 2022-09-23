<script lang='ts'>
import { defineComponent } from '@vue/runtime-core'

export default defineComponent({})
//noinspection JSUnusedGlobalSymbols
export const componentInfo = {
  name : 'ChatViewer',
  label: 'チャットビューアー',
}
</script>

<script setup lang='ts'>
import { computed, inject, ref, watch } from 'vue'
import { InjectionKeySymbol as roomCollectionsKey, StoreType as RoomCollectionStore } from '~/data/RoomCollections'
import UserAvatar from '~/components/UserAvatar.vue'
import { Chat } from '~/data/RoomCollections/Chat'
import { uuid } from 'vue-uuid'
import { InjectionKeySymbol as sessionKey, StoreType as SessionStore } from '~/data/session'

const paneId = uuid.v4()

const store        = inject(roomCollectionsKey) as RoomCollectionStore
const sessionStore = inject(sessionKey) as SessionStore

const getUser    = (chat: Chat) => store.users.value.find(u => u.uuid === chat.owner_user)
const isToday    = (date: Date) => {
  const today = new Date()
  return date.getDate() ==
         today.getDate() &&
         date.getMonth() ==
         today.getMonth() &&
         date.getFullYear() ==
         today.getFullYear()
}
const editChat   = (chat_uuid: string) => {

}
const deleteChat = (chat_uuid: string) => {

}

const tabs = computed(() => {
  if (sessionStore.navType.value === 'other-player') {
    const user = store.users.value.find(u => u.uuid === sessionStore.nav1.value)
    return [
      {
        title: `${user?.name || ''}`,
        icon : 'key-variant',
        value: user?.uuid,
      },
    ]
  } else {
    return [
      {
        title: 'メイン',
        icon : 'home',
        value: '',
      }, {
        title: 'システム',
        icon : 'desktop-classic',
        value: 'system',
      },
    ]
  }
})
const tab  = ref(tabs.value[0].value)
watch(tabs, () => {
  if (tabs.value.some(t => t.value === tab.value)) {
    return
  }
  tab.value = tabs.value[0].value
}, {
        immediate: true,
        deep     : true,
      })
watch(tab, value => {
  console.log(value)
})
const chats = computed(() => store.chats.value.filter(c => c.tab ===
                                                           (
                                                             tab.value || null
                                                           )))

watch(() => chats.value.length, (after, before) => {
  if (before < after) {
    const chat_uuid = store.chats.value[store.chats.value.length - 1].uuid
    setTimeout(() => document.getElementById(`${paneId}-${chat_uuid}`)?.scrollIntoView())
  }
})
</script>

<template>
  <div>room_uuid: {{ sessionStore.room_uuid }}</div>
  <div>user_uuid: {{ sessionStore.user_uuid }}</div>
  <div>nav1: {{ sessionStore.nav1 }}</div>
  <div>nav2: {{ sessionStore.nav2 }}</div>
  <v-tabs
    v-model='tab'
    background-color='transparent'
    slider-color='pink-accent-3'
    density='compact'
    :align-with-title='false'
    :show-arrows='true'
    :center-active='true'
  >
    <template v-for='tab in tabs'>
      <v-badge location='right top' :dot='true' offset-y='6' offset-x='10' color='pink-accent-3'>
        <v-tab :value='tab.value'>
          <v-icon :key='tab.value'>mdi-{{ tab.icon }}</v-icon>
          {{ tab.title }}
        </v-tab>
      </v-badge>
    </template>
  </v-tabs>
  <v-list class='chat-viewer scroll h-100'>
    <v-list-item
      v-for='chat in chats'
      :id='`${paneId}-${chat.uuid}`'
      :key='chat.uuid'
      class='px-1'
    >
      <template #prepend>
        <user-avatar
          v-if='getUser(chat)'
          :user='getUser(chat)'
        ></user-avatar>
        <v-icon v-else icon='mdi-penguin'></v-icon>
      </template>
      <template #append>
        <v-menu open-on-hover>
          <template v-slot:activator='{ props }'>
            <v-btn icon='mdi-dots-vertical' size='x-small' variant='text' class='text-grey' v-bind='props'></v-btn>
          </template>

          <v-list class='border-solid'>
            <v-list-item @click='editChat(chat.uuid)'>編集</v-list-item>
            <v-list-item @click='deleteChat(chat.uuid)'>削除</v-list-item>
          </v-list>
        </v-menu>
      </template>
      <v-list-item-title class='ml-3'>
        <span class='font-weight-bold mr-2' v-if='getUser(chat)?.name'>{{ getUser(chat)?.name }}</span>
        <span style='font-size: 70%'>{{
            isToday(chat.updated_at) ? $d(chat.updated_at, 'time') : $d(chat.updated_at, 'short')
          }}</span>
      </v-list-item-title>
      <div class='ml-3' style='white-space: pre'>
        {{ chat.raw }}
      </div>
    </v-list-item>
  </v-list>
</template>

<!--suppress HtmlUnknownAttribute -->
<style lang='css' deep>
.chat-viewer .v-list-item__prepend,
.chat-viewer .v-list-item__append {
  align-self: flex-start;
}

.v-tab {
  min-width: 65px !important;
  color: rgb(var(--v-theme-on-surface));
}
</style>
