<script setup lang='ts'>
const props = defineProps<{
  room_uuid: string; user_uuid?: string; user_name?: string; user_password?: string; auto_play?: string; loggedIn: boolean;
}>()

import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()

const copiedNotify                           = ref(false)
let copyToolTipTimeoutId: number | undefined = undefined
const copy                                   = (text: string) => {
  copiedNotify.value = false
  navigator.clipboard.writeText(text)
           .then(() => {
             console.log('Text copied to clipboard...')
           })
           .catch(err => {
             console.log('Something went wrong', err)
           })
  setTimeout(() => {
    copiedNotify.value = true
    if (copyToolTipTimeoutId !== undefined) {
      clearTimeout(copyToolTipTimeoutId)
    }
    copyToolTipTimeoutId = setTimeout(() => {
      copiedNotify.value   = false
      copyToolTipTimeoutId = undefined
    }, 2000)
  }, 100)
}

const inviteUrl = location.host + router.resolve({
                                                   name  : 'room',
                                                   params: { room_uuid: props.room_uuid },
                                                 })?.href
</script>

<template>
  <v-list class='ma-4' v-if='!loggedIn'>
    <v-list-item @click='copy(inviteUrl)'>
      <template #prepend>
        <v-icon>mdi-account-plus</v-icon>
        部屋への招待URL
      </template>
      <span class='ml-5' style='white-space: nowrap;'>{{ inviteUrl }}</span>
      <v-icon class='ml-1'>mdi-content-copy</v-icon>
      <v-tooltip v-model='copiedNotify' v-if='copiedNotify' location='right'>
        <template v-slot:activator='{ props }'>
          <span v-bind='props'></span>
        </template>
        <span>コピーしました</span>
      </v-tooltip>
    </v-list-item>
  </v-list>
</template>