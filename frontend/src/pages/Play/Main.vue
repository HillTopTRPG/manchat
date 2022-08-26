<script setup lang="ts">
import provideAll from "~/data/Play"
provideAll()

import Contents from "./Contents.vue"
import defaultLayout from "./DefaultLayout";

interface Props {
  user_uuid: string
}
defineProps<Props>()
</script>

<template>
  <Contents :layout="defaultLayout" :user_uuid="user_uuid" />
</template>
