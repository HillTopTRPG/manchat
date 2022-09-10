<script setup lang='ts'>
import { useRouter } from 'vue-router'
import { computed, ref, watch } from 'vue'
import { pick } from 'lodash'
import axios from 'axios'

const props = defineProps<{
  room_uuid: string
  loggedIn: boolean
  user_uuid?: string
  user_name?: string
  user_password?: string
  auto_play?: string
  ready: boolean
  users: {
    id: number
    uuid: string
    name: string
    user_type: string
    room_uuid: string
    last_logged_in: Date
    created_at: Date
    updated_at: Date
  }[]
}>()
const emits = defineEmits<{
  (e: 'requireUserLogin'): void
}>()

const user = computed(() => props.users.find(u => u.uuid === props.user_uuid))

const router = useRouter()

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

interface UserTypeSelection {
  title: string
  value: string
  hint: string
}

const userTypeSelection: UserTypeSelection[] = [
  {
    title: 'マスター',
    value: 'master',
    hint : '特別な操作が許可されます。',
  }, {
    title: 'プレイヤー',
    value: 'player',
    hint : '',
  }, {
    title: '見学者',
    value: 'visitor',
    hint : '閲覧のみ許可されます。',
  },
]

const userType = ref<UserTypeSelection | undefined>(userTypeSelection.find(s => s.value === user.value?.user_type))

watch(() => userType.value?.value, (value, before) => {
  if (!before || !props.user_uuid) {
    return
  }
  const { room_token } = JSON.parse(localStorage.getItem(props.room_uuid) || '{}')
  const { user_token } = JSON.parse(localStorage.getItem(props.user_uuid || '') || '{}')
  axios.patch(`/api/v1/users/${props.user_uuid}`, {
    room_uuid  : props.room_uuid,
    user_uuid  : props.user_uuid,
    room_token,
    user_token,
    api_v1_user: {
      ...pick(user.value, ['name', 'user_type', 'last_logged_in']),
      user_type: value,
    },
  }).then((data: any) => {
    if (data.data.verify !== 'success') {
      console.log(JSON.stringify(data.data, null, '  '))
      switch (data.data.reason) {
        case 'no_such_room':
          return router.replace({ name: 'lobby' }).then()
        case 'expire_room_token':
          return router.replace({
                                  name : 'lobby',
                                  query: { r: props.room_uuid },
                                })
        case 'no_such_user':
          router.replace({
                           name  : 'room',
                           params: { room_uuid: props.room_uuid },
                         }).then()
          break
        case 'expire_user_token':
          emits('requireUserLogin')
          break
        default:
      }
    }
  })
}, { deep: true })
watch(() => user.value?.user_type, (_, before) => {
  userType.value = userTypeSelection.find(s => s.value === user.value?.user_type) || userTypeSelection[1]
})
</script>

<template>
  <template v-if='ready'>
    <v-list class='ma-4' v-if='!loggedIn' density='compact'>
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

    <v-select
      class='ma-4'
      v-model='userType'
      :items='userTypeSelection'
      item-value='value'
      item-title='title'
      :hint='userType?.hint'
      label='ユーザータイプ'
      persistent-hint
      return-object
      v-if='loggedIn'
    />
  </template>
</template>