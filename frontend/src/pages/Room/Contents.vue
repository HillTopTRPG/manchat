<script setup lang='ts'>
import { useRouter } from 'vue-router'
import { computed, inject, ref, watch } from 'vue'
import { Nav, userPatch } from '~/pages/AccountHelper'
import { merge } from 'lodash'
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
const emits = defineEmits<{
  (e: 'requireUserLogin'): void
}>()

const user = computed(() => props.users.find(u => u.uuid === props.user_uuid))

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

watch(() => userType.value?.value, (user_type, before) => {
  if (!before || !props.user_uuid || !user.value) {
    return
  }
  userPatch(merge({}, env, props), user, { user_type }, () => emits('requireUserLogin')).then()
}, { deep: true })
watch(() => user.value?.user_type, (value) => {
  userType.value = userTypeSelection.find(s => s.value === value) || userTypeSelection[1]
})
</script>

<template>
  <template v-if='nav !== "init"'>
    {{ nav }}
    <transition name='fade'>
      <template v-if='nav === "entrance"'>
        <v-list class='ma-4' density='compact'>
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
    </transition>

    <template v-if='nav === "profile"'>
      <transition name='fade'>
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
        />
      </transition>
    </template>

    <template v-if='nav === "room-info"'>
    </template>
  </template>
</template>

<style deep lang='css'>

.slide-fade-enter-active {
  transition: all .3s ease-out;
}

.slide-fade-leave-active {
  transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
