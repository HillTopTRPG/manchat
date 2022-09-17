<script setup lang='ts'>
import { User } from '~/data/user'
import { userTypeSelection } from '~/pages/AccountHelper'
import UserIcon from '~/pages/Room/Components/UserIcon.vue'

defineProps<{
  user: User
  hideTitle: boolean
}>()

const emits = defineEmits<{
  (e: 'click-list-item'): void
}>()
</script>

<template>
  <v-tooltip transition='scale-transition' v-if='user'>
    <template #activator='{ props }'>
      <v-list-item
        class='py-2'
        :value='user.uuid'
        active-color='primary'
        variant='elevated'
        v-bind='props'
        @click='emits("click-list-item")'
      >
        <template #prepend>
          <user-icon :user='user' />
        </template>
        <transition name='fade'>
          <v-list-item-title class='pl-7' v-if='!hideTitle'>{{ user.name }}</v-list-item-title>
        </transition>
      </v-list-item>
    </template>
    <v-card class='font-weight-bold' variant='flat'>
      <v-card-title>{{ user.name }}</v-card-title>
      <v-card-text>{{ userTypeSelection.find(s => s.value === user.user_type)?.title }}
      </v-card-text>
    </v-card>
  </v-tooltip>
</template>
