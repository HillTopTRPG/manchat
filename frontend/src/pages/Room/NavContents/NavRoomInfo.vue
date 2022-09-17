<script setup lang='ts'>
import { useRouter } from 'vue-router'
import { computed, inject, ref, watch } from 'vue'
import { Nav, roomDelete, roomPatch, toLobby } from '~/pages/AccountHelper'
import { merge } from 'lodash'
import { User } from '~/data/user'
import RoomLogoutDialogButton from '~/pages/Room/Dialog/RoomLogoutDialogButton.vue'
import UserLogoutDialogButton from '~/pages/Room/Dialog/UserLogoutDialogButton.vue'
import DeleteDialogButton from '~/pages/Room/Dialog/DeleteDialogButton.vue'
import { Room } from '~/data/room'

const props = defineProps<{
  room_uuid: string
  user_uuid?: string
  user_name?: string
  user_password?: string
  auto_play?: string
  nav: Nav
  users: User[]
  room: Room | null
}>()

const emits = defineEmits<{
  (e: 'logoutUser'): void
  (e: 'requireRoomLogin'): void
}>()

const user = computed(() => props.users.find(u => u.uuid === props.user_uuid))

const roomName = ref('')
watch(() => props.room, () => {
  roomName.value = props.room?.name || ''
}, {
        deep     : true,
        immediate: true,
      })

const router = useRouter()
const axios  = inject('axios') as any

const env = {
  router,
  axios,
}

const copiedNotify                           = ref(false)
let copyToolTipTimeoutId: number | undefined = undefined
const copy                                   = async (text: string) => {
  copiedNotify.value = false
  try {
    await navigator.clipboard.writeText(text)
    console.log('Text copied to clipboard...')
  } catch (err) {
    console.log('Something went wrong', err)
  }
  setTimeout(() => {
    copiedNotify.value = true
    if (copyToolTipTimeoutId !== undefined) {
      clearTimeout(copyToolTipTimeoutId)
    }
    copyToolTipTimeoutId = window.setTimeout(() => {
      copiedNotify.value   = false
      copyToolTipTimeoutId = undefined
    }, 2000)
  }, 100)
}

const inviteUrl = location.host + router.resolve({
                                                   name  : 'room',
                                                   params: { room_uuid: props.room_uuid },
                                                 })?.href

const updateRoom = () => {
  const name = roomName.value
  if (!name || !props.user_uuid || !user.value || !props.room) {
    return
  }
  return roomPatch(merge({}, env, props), props.room, {
    name,
  })
}

const deleteRoom = async () => {
  const args = merge({}, env, props)
  await roomDelete(args)
}
</script>

<template>
  <template v-if='nav === "entrance" || nav === "room-basic"'>
    <v-list class='ma-4' lines='two' bg-color='transparent'>
      <v-list-item @click='copy(inviteUrl)' variant='text' style='vertical-align: middle'>
        <span>部屋への招待URL</span>
        <span class='ml-5' style='white-space: nowrap;'>{{ inviteUrl }}</span>
        <v-icon class='ml-1'>mdi-content-copy</v-icon>
        <v-tooltip v-model='copiedNotify' v-if='copiedNotify' location='right'>
          <template v-slot:activator='{ props }'>
            <span v-bind='props'></span>
          </template>
          <span>コピーしました</span>
        </v-tooltip>
      </v-list-item>
      <v-list-item variant='text'>
        <v-list-item-action>
          <room-logout-dialog-button @execute='toLobby(merge({ router }, props), false)' />
          <user-logout-dialog-button @execute='emits("logoutUser")' v-if='user_uuid' button-class='ml-3' />
        </v-list-item-action>
      </v-list-item>

      <v-list-item variant='text' v-if='!users.length || user?.user_type === "master"'>
        <v-list-item-action>
          <delete-dialog-button
            @execute='deleteRoom()'
            button-text='部屋を削除する'
            dialog-title='この部屋を削除しますか？'
          />
        </v-list-item-action>
      </v-list-item>
    </v-list>

    <template v-if='user?.user_type === "master"'>
      <v-form>
        <v-container>
          <v-row class='ma-0'>
            <v-col class='pa-0'>
              <v-text-field
                v-model='roomName'
                label='名前'
                hint='必須項目'
              />
            </v-col>
          </v-row>
          <v-row class='mx-0 my-4'>
            <v-col class='pa-0'>
              <v-btn color='secondary' @click='updateRoom()'>更新</v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </template>
  </template>
</template>
