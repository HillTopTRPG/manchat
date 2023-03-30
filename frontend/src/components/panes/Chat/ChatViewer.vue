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
  <v-list class='chat-viewer scroll h-100' :class='{ isScrolling }' ref='list' @scroll='onScroll'>
    <DynamicScroller :items='chats' key-field='uuid' :min-item-size='57' :page-mode='true'>
      <template v-slot='{ item, index, active }'>
        <DynamicScrollerItem
          :item='item'
          :active='active'
          :size-dependencies='[ item.raw, ]'
          :data-index='index'
        >
          <v-hover v-slot='{ isHovering, props: hoverProps }'>
            <v-menu
              open-on-hover
              location='top right'
              :transition='false'
              class='chat-viewer-menu'
              open-delay='0'
              close-delay='0'
              v-bind='hoverProps'
            >
              <template v-slot:activator='{ props }'>
                <div v-bind='hoverProps'>
                  <v-list-item class='px-1' :class='{ hover: isHovering }' v-bind='props'>
                    <template #prepend>
                      <user-avatar
                        v-if='getUser(item)'
                        :user='getUser(item)'
                      ></user-avatar>
                      <v-icon v-else icon='mdi-desktop-classic' class='mx-2 mt-2'></v-icon>
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
                </div>
              </template>

              <div v-bind='hoverProps'>
                <v-defaults-provider :defaults='{ VBtn: { size: "small", variant: "text", rounded: 0 }, VTooltip: { location: "top", origin: "center", transition: "none" } }'>
                  <v-tooltip>
                    <template #activator='{ props }'>
                      <v-btn v-bind='props' @click='editChat(item.uuid)' icon='mdi-heart-plus' />
                    </template>
                    リアクション
                  </v-tooltip>
                  <v-tooltip>
                    <template #activator='{ props }'>
                      <v-btn v-bind='props' @click='editChat(item.uuid)' icon='mdi-pen' />
                    </template>
                    編集
                  </v-tooltip>
                  <v-tooltip>
                    <template #activator='{ props }'>
                      <v-btn v-bind='props' @click='deleteChat(item.uuid)' icon='mdi-delete' />
                    </template>
                    削除
                  </v-tooltip>
                </v-defaults-provider>
              </div>
            </v-menu>
          </v-hover>
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
