<script setup lang='ts'>
import 'splitpanes/dist/splitpanes.css'
import SplitPanesLayer, {Layout} from "./SplitPanesLayer.vue"
import {ref} from "vue"
import { uuid } from "vue-uuid"

interface Props {
  showBar: boolean
}

defineProps<Props>()

const layoutData = ref<Layout>({
  type: "vertical",
  uuid: uuid.v4(),
  panes: [
    {
      type: "horizontal",
      uuid: uuid.v4(),
      size: 90,
      panes: [
        {
          type: "vertical",
          uuid: uuid.v4(),
          panes: [
            { type: "normal", uuid: uuid.v4(), panes: [], component: "サンプルペイン1", size: 30 },
            { type: "normal", uuid: uuid.v4(), panes: [], component: "サンプルペイン2" },
          ]
        },
        { type: "normal", uuid: uuid.v4(), panes: [], component: "サンプルペイン1", size: 20 },
      ]
    },
    { type: "normal", uuid: uuid.v4(), panes: [], component: "サンプルペイン2" },
  ]
})
</script>

<template>
  <split-panes-layer style="height: 100vh" :layout="layoutData" :root-layout="layoutData" :show-bar="showBar" />
</template>
