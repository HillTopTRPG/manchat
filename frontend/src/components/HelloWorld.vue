<script setup lang='ts'>
import 'splitpanes/dist/splitpanes.css'
import SplitPanesLayer from "./SplitPanesLayer.vue"
import {ref} from "vue"
import { uuid } from "vue-uuid"

interface Props {
  showBar: boolean
}

defineProps<Props>()

type LayoutData = {
  type: string
  uuid: string
  panes: LayoutData[]
}

const layoutData = ref<LayoutData>({
  type: "vertical",
  uuid: uuid.v4(),
  panes: [
    {
      type: "horizontal",
      uuid: uuid.v4(),
      panes: [
        {
          type: "vertical",
          uuid: uuid.v4(),
          panes: [
            { type: "normal", uuid: uuid.v4(), panes: [] },
            { type: "normal", uuid: uuid.v4(), panes: [] },
          ]
        },
        { type: "normal", uuid: uuid.v4(), panes: [] },
      ]
    },
    { type: "normal", uuid: uuid.v4(), panes: [] },
  ]
})
</script>

<template>
  <split-panes-layer style="height: 100vh" :layout="layoutData" :root-layout="layoutData" :show-bar="showBar" />
</template>
