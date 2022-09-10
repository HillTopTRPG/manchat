<script setup lang='ts'>
import Contents from './Contents.vue'
import defaultLayout from './DefaultLayout'
import { useTheme } from 'vuetify'
import { useRouter } from 'vue-router'
import { inject, ref, watch } from 'vue'
import { InjectionKeySymbol as sessionKey, StoreType as SessionStore } from '~/data/session'

const props = defineProps<{
  room_uuid: string
  user_uuid: string
}>()

const theme             = useTheme()
theme.global.name.value = localStorage.getItem('view.theme') || 'light'
const ready             = ref(false)

// TODO use
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
  localStorage.setItem('view.theme', theme.global.name.value)
}

const sessionState = inject(sessionKey) as SessionStore

const router = useRouter()

const axios = inject('axios') as any

const initialize = async () => {
  ready.value          = false
  const { room_token } = JSON.parse(localStorage.getItem(props.room_uuid) || '{}')
  const { user_token } = JSON.parse(localStorage.getItem(props.user_uuid) || '{}')

  const toLobby = (hasQuery: boolean) => router
    .replace({
               name : 'lobby',
               query: hasQuery ? {
                 r        : props.room_uuid,
                 u        : props.user_uuid,
                 auto_play: 1,
               } : undefined,
             })

  const toRoom = (hasQuery: boolean) => router
    .replace({
               name  : 'room',
               params: { room_uuid: props.room_uuid },
               query : hasQuery ? {
                 u        : props.user_uuid,
                 auto_play: 1,
               } : undefined,
             })

  const toRoomUser = () => router
    .replace({
               name  : 'room',
               params: {
                 room_uuid: props.room_uuid,
                 user_uuid: props.user_uuid,
               },
               query : {
                 auto_play: 1,
               },
             })

  if (!room_token) {
    return toLobby(true)
  }
  if (!user_token) {
    return toRoom(true)
  }

  const { data: usersData } = await axios.post(`/api/v1/users/${props.user_uuid}/token/${user_token}/check`, {
    room_uuid        : props.room_uuid,
    room_token,
    subscription_uuid: sessionState.state.session_uuid,
  })
  console.log(JSON.stringify(usersData, null, '  '))
  if (usersData.verify !== 'success') {
    switch (usersData.reason) {
      case 'no_such_room':
        return toLobby(false)
      case 'expire_room_token':
        return toLobby(true)
      case 'no_such_user':
        return toRoom(false)
      case 'expire_user_token':
        return toRoomUser()
      default:
        return toRoom(true)
    }
  }
  ready.value = true
}
initialize().then()
watch([() => props.room_uuid, () => props.user_uuid], initialize)
</script>

<template>
  <Contents :layout='defaultLayout' :room_uuid='room_uuid' :user_uuid='user_uuid' :ready='ready' />
</template>
