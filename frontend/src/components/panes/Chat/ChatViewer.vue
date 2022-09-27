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
import { InjectionKeySymbol as sessionKey, StoreType as SessionStore } from '~/data/session'
import { Layout } from '~/components/panes'

const props = defineProps<{
  layout: Layout
}>()

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
        value: '$$$ALL$$$',
      }, {
        title: 'メイン',
        icon : 'home',
        value: '',
      }, {
        title: 'システム',
        icon : 'desktop-classic',
        value: 'system',
      },
    ]
  } else {
    return [
      {
        title: '全体',
        icon : 'moon-full',
        value: '$$$ALL$$$',
      }, {
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

const setTab = (tab: string) => {
  if (!props.layout.payload) {
    props.layout.payload = {}
  }
  props.layout.payload.tab = tab
}
const tab    = computed(() => props.layout.payload?.tab !== undefined ? props.layout.payload?.tab : (
  tabs.value[0]?.value || ''
))
watch(tabs, () => {
  if (tabs.value.some(t => t.value === tab.value)) {
    return
  }
  setTab(tabs.value[0].value)
}, {
        immediate: true,
        deep     : true,
      })
watch(tab, value => {
  console.log(value)
})
const chats = computed(() => {
  const chats   = store.chats.value
  const navType = sessionStore.navType.value
  if (navType === 'room' || navType === 'player') {
    if (tab.value === '$$$ALL$$$') {
      return chats.filter(c => !c.target_uuid)
    }
    return store.chats.value.filter(c => !c.target_uuid &&
                                         (
                                           c.tab || ''
                                         ) ===
                                         tab.value)
  }
  if (navType === 'other-player') {
    const nav1      = sessionStore.nav1.value
    const user_uuid = sessionStore.user_uuid.value
    if (tab.value === '$$$ALL$$$') {
      return chats.filter(c => (
                                 c.owner_user === user_uuid && c.target_uuid === nav1
                               ) ||
                               (
                                 c.owner_user === nav1 && c.target_uuid === user_uuid
                               ))
    }
    return store.chats.value.filter(c => (
                                           c.tab || ''
                                         ) ===
                                         tab.value &&
                                         (
                                           (
                                             c.owner_user === user_uuid && c.target_uuid === nav1
                                           ) ||
                                           (
                                             c.owner_user === nav1 && c.target_uuid === user_uuid
                                           )
                                         ))
  }
  return []
})

const list = ref()
watch(() => chats.value.length, (after, before) => {
  console.log(`${after}件`)
  if (before < after) {
    const elm = list.value.$el
    setTimeout(() => elm.scrollTo(0, elm.scrollHeight))
  }
})
</script>

<template>
  <v-tabs
    :model-value='tab'
    @update:modelValue='setTab'
    background-color='transparent'
    slider-color='pink-accent-3'
    density='compact'
    :align-with-title='false'
    :show-arrows='true'
    :center-active='true'
  >
    <template v-for='tab in tabs' :key='tab.value'>
      <v-badge location='right top' :dot='true' offset-y='6' offset-x='10' color='pink-accent-3'>
        <v-tab :value='tab.value'>
          <v-icon :key='tab.icon'>mdi-{{ tab.icon }}</v-icon>
          {{ tab.title }}
        </v-tab>
      </v-badge>
    </template>
  </v-tabs>
  <v-list class='chat-viewer scroll h-100' ref='list'>
    <DynamicScroller :items='chats' key-field='uuid' :min-item-size='57' :page-mode='true'>
      <template v-slot='{ item, index, active }'>
        <DynamicScrollerItem
          :item='item'
          :active='active'
          :size-dependencies='[ item.raw, ]'
          :data-index='index'
        >
          <v-list-item class='px-1'>
            <template #prepend>
              <user-avatar
                v-if='getUser(item)'
                :user='getUser(item)'
              ></user-avatar>
              <v-icon v-else icon='mdi-penguin'></v-icon>
            </template>
            <template #append>
              <v-menu open-on-hover>
                <template v-slot:activator='{ props }'>
                  <v-btn
                    icon='mdi-dots-vertical'
                    size='x-small'
                    variant='text'
                    class='text-grey'
                    v-bind='props'
                  ></v-btn>
                </template>

                <v-list class='border-solid'>
                  <v-list-item @click='editChat(item.uuid)'>編集</v-list-item>
                  <v-list-item @click='deleteChat(item.uuid)'>削除</v-list-item>
                </v-list>
              </v-menu>
            </template>
            <v-list-item-title class='ml-3'>
              <span class='font-weight-bold mr-2' v-if='getUser(item)?.name'>{{ getUser(item)?.name }}</span>
              <span style='font-size: 70%'>{{
                  isToday(item.updated_at) ? $d(item.updated_at, 'time') : $d(item.updated_at, 'short')
                }}</span>
            </v-list-item-title>
            <div class='ml-3' style='white-space: pre'>
              {{ item.raw }}
            </div>
          </v-list-item>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
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
