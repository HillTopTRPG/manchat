<script setup lang='ts'>
//noinspection TypeScriptCheckImport
import SplitPanesLayer, { Layout } from '~/components/SplitPanesLayer.vue'
import { useRouter } from 'vue-router'
import { inject, ref } from 'vue'

const props = defineProps<{
  room_uuid: string; user_uuid: string; layout: Layout;
}>()

const router = useRouter()

const axios = inject('axios') as any

await (
  async () => {
    const { room_token } = JSON.parse(localStorage.getItem(props.room_uuid) || '{}')
    const toLobbyQuery   = {
      r        : props.room_uuid,
      u        : props.user_uuid,
      auto_play: 1,
    }
    if (!room_token) {
      // 部屋トークンが取得できない状況はロビーに戻す
      return router.replace({
                              name : 'lobby',
                              query: toLobbyQuery,
                            }).then()
    }
    const { data: roomsData } = await axios.post(`/api/v1/rooms/${props.room_uuid}/token/${room_token}/check`)
    console.log(JSON.stringify(roomsData, null, '  '))
    if (roomsData.verify !== 'success') {
      return router.replace({
                              name : 'lobby',
                              query: roomsData.reason === 'no_such_room' ? undefined : toLobbyQuery,
                            }).then()
    }

    const { user_token } = JSON.parse(localStorage.getItem(props.user_uuid) || '{}')
    if (!user_token) {
      // ユーザートークンが取得できない状況は部屋に戻す
      return router.replace({
                              name  : 'room',
                              params: { room_uuid: props.room_uuid },
                              query : {
                                u        : props.user_uuid,
                                auto_play: 1,
                              },
                            }).then()
    }
    const { data: usersData } = await axios.post(`/api/v1/users/${props.user_uuid}/token/${user_token}/check`, {
      room_uuid: props.room_uuid,
      room_token,
    })
    console.log(JSON.stringify(usersData, null, '  '))
    if (usersData.verify !== 'success') {
      switch (usersData.reason) {
        case 'no_such_room':
          return router.replace({ name: 'lobby' }).then()
        case 'expire_room_token':
          return router.replace({
                                  name : 'lobby',
                                  query: {
                                    r        : props.room_uuid,
                                    u        : props.user_uuid,
                                    auto_play: 1,
                                  },
                                }).then()
        case 'no_such_user':
          return router.replace({
                                  name  : 'room',
                                  params: { room_uuid: props.room_uuid },
                                }).then()
        case 'expire_user_token':
          return router.replace({
                                  name  : 'room-user',
                                  params: {
                                    room_uuid: props.room_uuid,
                                    user_uuid: props.user_uuid,
                                  },
                                  query : { auto_play: 1 },
                                }).then()
        default:
          return router.replace({
                                  name  : 'room',
                                  params: { room_uuid: props.room_uuid },
                                  query : {
                                    u        : props.user_uuid,
                                    auto_play: 1,
                                  },
                                }).then()
      }
    }
  }
)()

const showBar      = ref(false)
const isDrawerOpen = ref(true)
const isRail       = ref(true)

const fgx = (val: number) => {
  console.log(val)
}
</script>

<template>
  <v-layout>
    <v-navigation-drawer
      v-model='isDrawerOpen'
      :rail='isRail'
      rail-width='55'
    >
      <v-list class='overflow-hidden' shaped>
        <v-list-item
          v-ripple
          :prepend-icon='isRail ? "mdi-chevron-right" : "mdi-chevron-left"'
          @click='isRail = !isRail'
        />
      </v-list>

      <v-divider />

      <v-list density='compact' :nav='true' class='overflow-hidden' rounded>
        <v-list-item v-ripple prepend-icon='mdi-folder' title='My Files' @click='fgx(111)' />
        <v-list-item v-ripple prepend-icon='mdi-account-multiple' title='Shared with me' @click='fgx(222)' />
        <v-list-item v-ripple prepend-icon='mdi-star' title='Starred' @click='fgx(333)' />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      color='teal-darken-4'
      image='https://picsum.photos/1920/1080?random'
      :title='`Room: ${user_uuid}`'
      elevation='1'
    >
      <template #image>
        <v-img gradient='to top right, rgba(19,84,122,.8), rgba(128,208,199,.8)'></v-img>
      </template>

      <v-spacer />

      <v-btn size='small' icon='mdi-pencil-ruler' @click='showBar = !showBar'></v-btn>
      <v-btn icon='mdi-dots-vertical' />
    </v-app-bar>

    <v-main>
      <split-panes-layer :layout='layout' :root-layout='layout' :show-bar='showBar' />
    </v-main>
  </v-layout>
</template>
