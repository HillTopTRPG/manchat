<template>
  <split-panes-layer class="default-theme" style="height: 100vh" :layout="layoutData" />
</template>

<script setup lang='ts'>
import 'splitpanes/dist/splitpanes.css'
import SplitPanesLayer from "./SplitPanesLayer.vue";

type LayoutData = {
  type: string
  panes?: LayoutData[]
}

const layoutData: LayoutData = {
  type: "vertical",
  panes: [
    {
      type: "horizontal",
      panes: [
        {
          type: "vertical",
          panes: [
            { type: "normal" },
            { type: "normal" },
          ]
        },
        {
          type: "vertical",
          panes: [
            { type: "normal" },
          ]
        },
      ]
    },
    {
      type: "horizontal",
      panes: [
        { type: "normal" },
      ]
    },
  ]
}
</script>
