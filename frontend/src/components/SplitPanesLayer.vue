<script lang='ts'>
export default { name: 'SplitPanesLayer' }
</script>
<script setup lang='ts'>
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import Sample from "./Sample.vue";
import {computed} from "vue";

interface Layout {
  type: string
  panes?: Layout[]
}

interface Props {
  layout: Layout
  isNest: boolean
  showBar: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isNest: false,
  showBar: true
})

const cLayout = computed(() => props.layout)
const cType = computed(() => cLayout.value.type)
const rootFlexDirection = computed(() => cLayout.value.type === 'horizontal' ? 'flex-row' : 'flex-column')
const sheetFlexDirection = computed(() => cLayout.value.type === 'horizontal' ? 'flex-column' : 'flex-row')

const addPane = () => {
  if (!cLayout.value.panes) return
  cLayout.value.panes.push({ type: "normal" })
}

const deletePane = () => {
  props.layout.panes?.pop()
}
</script>

<template>
  <div class="split-panes-layer d-flex w-100 h-100" :class="[ rootFlexDirection, isNest ? 'flex-fill' : 'root' ]">
    <v-sheet
        class="d-flex px-1 py-1"
        style="box-sizing: border-box; background-color: rgba(255, 255, 255, 0.1);"
        :class="sheetFlexDirection"
        v-if="showBar"
    >
      <div
          class="position-sticky d-flex"
          :class="sheetFlexDirection"
          style="gap: 1em; top: 1em; left: 1em;"
      >
        <v-btn size="x-small" icon="mdi-magnify" color="red" class="fixed-top"></v-btn>
        <v-btn size="x-small" icon="mdi-dots-vertical"></v-btn>
        <v-btn size="x-small" icon="mdi-plus" @click="addPane" />
      </div>
    </v-sheet>
    <splitpanes
        class="flex-fill"
        :class="isNest ? null : 'root'"
        :horizontal="cType === 'horizontal' || undefined"
        first-splitter="firstsplitter"
    >
      <pane
          v-for="(pane, idx) in cLayout.panes"
          :key="idx"
          class="d-flex justify-start align-start"
          :class="(pane.type !== 'horizontal' && pane.type !== 'vertical') ? 'last-generation pa-5' : null"
          :style="{ 'overflow': (pane.type === 'horizontal' || pane.type === 'vertical') ? 'hidden' : 'auto' }"
      >
        <SplitPanesLayer :layout="pane" v-if="pane.type === 'horizontal' || pane.type === 'vertical'" :is-nest="true" />
        <Sample v-else />
      </pane>
    </splitpanes>
  </div>
</template>

<style scoped lang="css">

</style>
<style deep lang="css">
.split-panes-layer.root {
  height: calc(100vh - 64px) !important;
  background: linear-gradient(-45deg, #EE7752, #E73C7E, #23A6D5, #23D5AB);
}

.splitpanes {
  overflow: auto;
  height: auto;
}

.splitpanes__pane {
  box-shadow: 0 0 5px rgba(0, 0, 0, .2) inset;
  justify-content: center;
  align-items: center;
  display: flex;
  min-width: 40px;
  min-height: 40px;
}
.splitpanes__pane.last-generation {
  background-color: rgba(255, 255, 255, 0.3);
}

.splitpanes--vertical > .splitpanes__splitter {
  min-width: 7px;
  background: linear-gradient(90deg, #ccc, #111);
}

.splitpanes--horizontal > .splitpanes__splitter {
  min-height: 7px;
  background: linear-gradient(#ccc, #111);
}
</style>
