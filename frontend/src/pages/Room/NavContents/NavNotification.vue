<script setup lang='ts'>
import { useRouter } from 'vue-router'
import { ref, watch } from 'vue'
import { Nav } from '~/pages/AccountHelper'
import { User } from '~/data/user'

const props = defineProps<{
  room_uuid: string
  user_uuid?: string
  user_name?: string
  user_password?: string
  auto_play?: string
  nav: Nav
  users: User[]
}>()

const router = useRouter()

const notificationEnabled = async () => {
  if (!window.Notification) {
    return false
  }
  if (Notification.permission === 'granted') {
    return true
  }
  if (Notification.permission === 'default') {
    const result = await Notification.requestPermission()
    return result === 'granted'
  }
  return false
}

const banNotifyDesktop  = ref(false)
const banNotifyAllSound = ref(false)
const notifyChatSound   = ref(false)
watch(banNotifyDesktop, (value) => {
  !value && notificationEnabled()
})

const testDesktopNotify = async () => {
  if (banNotifyDesktop.value || !await notificationEnabled()) {
    return
  }
  const time = Date.now().toLocaleString()
  const n    = new Notification('Hello World' + time, {
    icon: 'https://quoridorn.com/img/mascot/normal/mascot_normal.png',
    body: 'ここはぼでぃ',
  })
  n.addEventListener('click', () => {
    console.log('クリックされたぜ！！！！！')
  })
}

const testAudio = () => {
  const audio = new Audio('/button45.mp3')
  audio.play()
}

const testAudio2 = () => {
  const audio = new Audio('/button58.mp3')
  audio.play()
}

const defaults = {
  VSwitch  : {
    class      : 'mouse-event-none',
    readonly   : true,
    hideDetails: true,
    inset      : true,
    color      : 'primary',
    trueIcon   : 'mdi-check',
    falseIcon  : 'mdi-close',
  },
  VBtn     : {
    class  : 'ml-2',
    size   : 'x-small',
    variant: 'text',
  },
  VListItem: {
    variant: 'text',
  },
}
</script>

<template>
  <v-list v-if='nav === "notification"' :nav='true' bg-color='transparent'>
    <v-defaults-provider :defaults='defaults'>
      <v-list-subheader>デスクトップ通知</v-list-subheader>
      <v-list-item @click='banNotifyDesktop = !banNotifyDesktop'>
        <template #append>
          <v-switch :model-value='banNotifyDesktop' @click.self.prevent />
        </template>
        <v-list-item-title>デスクトップ通知をすべて無効にする
          <v-btn icon='mdi-bell' v-show='!banNotifyDesktop' @click.stop='testDesktopNotify()' />
        </v-list-item-title>
      </v-list-item>

      <v-list-subheader>サウンド</v-list-subheader>
      <v-list-item @click='banNotifyAllSound = !banNotifyAllSound'>
        <template #append>
          <v-switch :model-value='banNotifyAllSound' @click.self.prevent />
        </template>
        <v-list-item-title>通知音をすべて無効にする</v-list-item-title>
      </v-list-item>
      <v-list-item @click='notifyChatSound = !notifyChatSound'>
        <template #append>
          <v-switch :model-value='notifyChatSound' @click.self.prevent />
        </template>
        チャット
        <v-btn @click='testAudio()' icon='mdi-volume-source' @click.stop />
      </v-list-item>
      <v-list-item @click='notifyChatSound = !notifyChatSound'>
        <template #append>
          <v-switch :model-value='notifyChatSound' @click.self.prevent />
        </template>
        チャット2
        <v-btn @click='testAudio2()' icon='mdi-volume-source' @click.stop />
      </v-list-item>
    </v-defaults-provider>
  </v-list>
</template>

<!--suppress CssUnusedSymbol, HtmlUnknownAttribute -->
<style deep lang='css'>
.v-switch.mouse-event-none {
  pointer-events: none;
}
</style>
