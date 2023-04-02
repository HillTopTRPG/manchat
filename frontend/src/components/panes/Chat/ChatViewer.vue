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
import { computed, inject, reactive, ref, watch } from 'vue'
import { InjectionKeySymbol as roomCollectionsKey, StoreType as RoomCollectionStore } from '~/data/RoomCollections'
import { Chat } from '~/data/RoomCollections/Chat'
import { InjectionKeySymbol as sessionKey, StoreType as SessionStore } from '~/data/session'
import { Layout } from '~/components/panes'
import ChatViewerItem from '~/components/panes/Chat/ChatViewerItem.vue'

const props = defineProps<{
  layout: Layout
  rootLayout: Layout
}>()

const store        = inject(roomCollectionsKey) as RoomCollectionStore
const sessionStore = inject(sessionKey) as SessionStore
const axios: any   = inject('axios')

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
const chatContainFunc = (tabValue: string) => {
  const navType   = sessionStore.navType.value
  const tabFilter = (c: Chat) => (
                                   c.tab || ''
                                 ) === tabValue

  if (navType === 'room' || navType === 'player') {
    if (tabValue === '$$$ALL$$$') {
      return (c: Chat) => !c.target_uuid
    }
    return (c: Chat) => tabFilter(c) && !c.target_uuid
  }
  if (navType === 'other-player') {
    const nav1       = sessionStore.nav1.value
    const user_uuid  = sessionStore.user_uuid.value
    const baseFilter = (c: Chat) => (
                                      c.owner_user === user_uuid && c.target_uuid === nav1
                                    ) ||
                                    (
                                      c.owner_user === nav1 && c.target_uuid === user_uuid
                                    )
    if (tabValue === '$$$ALL$$$') {
      return (c: Chat) => baseFilter(c)
    }
    return (c: Chat) => tabFilter(c) && baseFilter(c)
  }
  return null
}
const chats           = computed(() => {
  const func = chatContainFunc(tab.value)
  if (func === null) {
    return []
  }
  return store.chats.value.filter(func)
})

const unreadChatList     = reactive<string[]>([])
const unreadChatListLate = reactive<string[]>([])

const list = ref()
watch(() => chats.value.length, (after, before) => {
  if (before < after) {
    const elm = list.value.$el
    setTimeout(() => elm.scrollTo(0, elm.scrollHeight))
  }
})
watch(() => store.chats.value.length, (after, before) => {
  if (before > 0 && before < after) {
    unreadChatList.splice(-1, 0, store.chats.value[store.chats.value.length - 1].uuid)
    unreadChatListLate.splice(-1, 0, store.chats.value[store.chats.value.length - 1].uuid)
  }
})

const isScrolling                     = ref(false)
let isScrollingTimeout: number | null = null

const onScroll = (evt: { target: HTMLElement }) => {
  isScrolling.value = true
  if (isScrollingTimeout !== null) {
    clearTimeout(isScrollingTimeout)
  }
  isScrollingTimeout = window.setTimeout(() => {
    isScrolling.value = false
  }, 100)

  evt.target.dispatchEvent(new MouseEvent('move', {
    screenX: 0,
    screenY: 0,
    bubbles: false,
  }))
}

const viewedChatItem = (uuid: string) => {
  const idx = unreadChatList.indexOf(uuid)
  if (idx < 0) {
    return
  }
  unreadChatList.splice(idx, 1)
  setTimeout(() => unreadChatListLate.splice(unreadChatListLate.indexOf(uuid), 1), 3000)
}
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
      <v-badge
        location='right top'
        :dot='true'
        :model-value='unreadChatList.some(uc => chatContainFunc(tab.value)(store.chats.value.find(c => c.uuid === uc)))'
        offset-y='6'
        offset-x='10'
        color='pink-accent-3'
      >
        <v-tab :value='tab.value'>
          <v-icon :key='tab.icon'>mdi-{{ tab.icon }}</v-icon>
          {{ tab.title }}
        </v-tab>
      </v-badge>
    </template>
  </v-tabs>
  <v-list class='chat-viewer scroll h-100' :class='{ isScrolling }' ref='list' @scroll='onScroll'>
    <DynamicScroller :items='chats' key-field='uuid' :min-item-size='57' :page-mode='true'>
      <template v-slot='{ item, index, active }'>
        <ChatViewerItem
          :item='item'
          :index='index'
          :active='active'
          @viewed='viewedChatItem'
          :is-new-read='unreadChatListLate.some(uc => uc === item.uuid)'
        />
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

.chat-viewer .v-list-item.hover {
  background: rgb(var(--v-theme-on-surface-variant));
}

.chat-viewer-menu .v-overlay__content {
  pointer-events: none !important;
}

.chat-viewer-menu .v-overlay__content > * {
  align-self: flex-end;
  pointer-events: auto !important;
  height: 30px !important;
  transform: translateY(50%);
}

.chat-viewer-menu .v-overlay__content .v-btn {
  background: rgb(var(--v-theme-on-surface-variant)) !important;
}

.chat-viewer-menu .v-overlay__content .v-btn--icon {
  width: calc(var(--v-btn-height) + 4px) !important;
  height: calc(var(--v-btn-height) + 4px) !important;;
}

.v-tab {
  min-width: 65px !important;
  color: rgb(var(--v-theme-on-surface));
}
</style>
