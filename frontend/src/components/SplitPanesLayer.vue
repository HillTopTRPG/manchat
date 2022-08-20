<script lang='ts'>
export default { name: 'SplitPanesLayer' }
</script>
<script setup lang='ts'>
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import Sample from "./Sample.vue"
import {ref} from "vue"
import { uuid } from 'vue-uuid'

interface Layout {
  type: string
  uuid: string
  panes: Layout[]
}

interface Props {
  layout: Layout
  rootLayout: Layout
  isNest?: boolean
  showBar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isNest: false,
  showBar: true
})

const cLayout = ref(props.layout)

const addChildPane = (idx: number, isAfter: boolean) => {
  if (!cLayout.value.panes) return
  if (!isAfter)
    cLayout.value.panes[idx].panes.push({ type: "normal", uuid: uuid.v4(), panes: [] })
  if (cLayout.value.panes[idx].type !== "horizontal" && cLayout.value.panes[idx].type !== "vertical") {
    cLayout.value.panes[idx].type = cLayout.value.type === "horizontal" ? "vertical" : "horizontal"
    const sUuid = cLayout.value.panes[idx].uuid
    cLayout.value.panes[idx].uuid = uuid.v4()
    cLayout.value.panes[idx].panes.push({ type: "normal", uuid: sUuid, panes: [] })
  }
  if (isAfter)
    cLayout.value.panes[idx].panes.push({ type: "normal", uuid: uuid.v4(), panes: [] })
}

const addPane = (event: { target: HTMLElement }) => {
  const btnElm: HTMLElement = event.target.tagName === "button" ? event.target : event.target.closest("button")!
  const idx = parseInt(btnElm.dataset.idx || "0")
  const direction = btnElm.dataset.direction
  console.log(`${cLayout.value.type}::[${idx}-${direction}] => ${cLayout.value.panes[idx].type}::${cLayout.value.panes[idx].panes.length}`)
  Array.from(document.getElementsByClassName( "split-panes-layer" ))
    .find((elm: Element) => (elm as HTMLElement).dataset.uuid === cLayout.value.panes[idx].uuid)
    ?.classList.remove(`on-hold-${direction}`)
  if (cLayout.value.type === "horizontal") {
    if (direction === "up" || direction === "down") {
      addBrotherPane(idx, direction === "down")
    } else if (cLayout.value.panes[idx].panes.length === 0) {
      addChildPane(idx, direction === "right")
    }
  }
  if (cLayout.value.type === "vertical") {
    if (direction === "left" || direction === "right") {
      addBrotherPane(idx, direction === "right")
    } else if (cLayout.value.panes[idx].panes.length === 0) {
      addChildPane(idx, direction === "down")
    }
  }
}

const onMouseEnter = (event: { target: HTMLElement }) => {
  const btnElm: HTMLElement = event.target.tagName === "button" ? event.target : event.target.closest("button")!
  const idx = parseInt(btnElm.dataset.idx || "0")
  const direction = btnElm.dataset.direction
  Array.from(document.getElementsByClassName( "split-panes-layer" ))
    .find((elm: Element) => (elm as HTMLElement).dataset.uuid === cLayout.value.panes[idx].uuid)
    ?.classList.add(direction ? `on-hold-${direction}` : "on-hold")
}

const onMouseLeave = (event: { target: HTMLElement }) => {
  const btnElm: HTMLElement = event.target.tagName === "button" ? event.target : event.target.closest("button")!
  const idx = parseInt(btnElm.dataset.idx || "0")
  const direction = btnElm.dataset.direction
  Array.from(document.getElementsByClassName( "split-panes-layer" ))
      .find((elm: Element) => (elm as HTMLElement).dataset.uuid === cLayout.value.panes[idx].uuid)
      ?.classList.remove(direction ? `on-hold-${direction}` : "on-hold")
}

const addBrotherPane = (idx: number, isAfter: boolean) => {
  const addObj: Layout = { type: "normal", uuid: uuid.v4(), panes: [] }
  cLayout.value.panes.splice(idx + (isAfter ? 1 : 0), 0, addObj)
}

const removePane = (event: { target: HTMLElement }) => {
  const btnElm: HTMLElement = event.target.tagName === "button" ? event.target : event.target.closest("button")!
  const idx = parseInt(btnElm.dataset.idx || "0")
  if (!cLayout.value.panes) return
  if (cLayout.value.panes.length === 2 && cLayout.value.uuid !== props.rootLayout.uuid) {
    const remain = cLayout.value.panes[idx === 0 ? 1 : 0]
    cLayout.value.panes = remain.panes
    cLayout.value.uuid = remain.uuid
    cLayout.value.type = remain.type
  } else {
    cLayout.value.panes.splice(idx, 1)
  }
}
</script>

<template>
  <splitpanes
    class="flex-fill"
    :class="isNest ? null : 'root'"
    :horizontal="cLayout.type === 'horizontal' || undefined"
    :first-splitter="(cLayout.panes?.length || 0) > 1"
    v-if="cLayout.type === 'horizontal' || cLayout.type === 'vertical'"
  >
    <pane
        v-for="(pane, idx) in cLayout.panes"
        :key="idx"
        class="d-flex justify-start align-start"
        :class="(pane.type !== 'horizontal' && pane.type !== 'vertical') ? 'last-generation' : null"
        :style="{ 'overflow': (pane.type === 'horizontal' || pane.type === 'vertical') ? 'hidden' : 'auto' }"
    >
      <div
        class="split-panes-layer d-flex w-100 h-100"
        :data-uuid="pane.uuid"
        :class="[
          cLayout.type === 'horizontal' && (pane.type === 'horizontal' || pane.type === 'vertical') ? 'flex-row' : 'flex-column',
          isNest ? 'flex-fill' : 'root'
        ]"
      >
        <v-sheet
          class="d-flex px-1 py-1"
          style="box-sizing: border-box; background-color: rgba(255, 255, 255, 0.1);"
          :class="cLayout.type === 'horizontal' && (pane.type === 'horizontal' || pane.type === 'vertical') ? 'flex-column' : 'flex-row'"
          v-if="showBar"
        >
          <div class="position-sticky d-flex" :class="cLayout.type === 'horizontal' && (pane.type === 'horizontal' || pane.type === 'vertical') ? 'flex-column h-100 py-5' : 'flex-row w-100 px-5'" style="gap: 1em; top: 0; left: 0;">
            <template v-if="pane.type === 'horizontal' || pane.type === 'vertical'">
              <v-btn size="x-small" icon="mdi-view-split-vertical" v-if="pane.type !== 'horizontal'" @click="pane.type = 'horizontal'"></v-btn>
              <v-btn size="x-small" icon="mdi-view-split-horizontal" v-if="pane.type !== 'vertical'" @click="pane.type = 'vertical'"></v-btn>
            </template>
            <template v-else>
              <v-btn size="x-small" icon="mdi-magnify"></v-btn>
            </template>
            <v-menu location="center">
              <template v-slot:activator="{ props: menu }">
                <v-btn size="x-small" color="primary" v-bind="menu" icon="mdi-plus" />
              </template>
              <v-container class="text-center">
                <v-row>
                  <v-col class="pa-0">
                    <v-btn
                      icon="mdi-chevron-up"
                      :rounded="0"
                      variant="text"
                      class="bg-white border-opacity-50"
                      v-if="cLayout.type === 'horizontal' || cLayout.panes[idx].panes.length === 0"
                      :data-idx="idx"
                      data-direction="up"
                      @click="addPane"
                      @mouseenter="onMouseEnter"
                      @mouseleave="onMouseLeave"
                    />
                  </v-col>
                </v-row>
                <v-row class="my-3">
                  <v-col class="pa-0">
                    <v-btn
                      icon="mdi-chevron-left"
                      :rounded="0"
                      variant="text"
                      class="bg-white"
                      v-if="cLayout.type === 'vertical' || cLayout.panes[idx].panes.length === 0"
                      :data-idx="idx"
                      data-direction="left"
                      @click="addPane"
                      @mouseenter="onMouseEnter"
                      @mouseleave="onMouseLeave"
                    ></v-btn>
                  </v-col>
                  <v-col class="pa-0">
                    <v-btn
                      icon=""
                      :rounded="0"
                      variant="plain"
                    ></v-btn>
                  </v-col>
                  <v-col class="pa-0">
                    <v-btn
                      icon="mdi-chevron-right"
                      :rounded="0"
                      variant="text"
                      class="bg-white"
                      v-if="cLayout.type === 'vertical' || cLayout.panes[idx].panes.length === 0"
                      :data-idx="idx"
                      data-direction="right"
                      @click="addPane"
                      @mouseenter="onMouseEnter"
                      @mouseleave="onMouseLeave"
                    ></v-btn>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col class="pa-0">
                    <v-btn
                      icon="mdi-chevron-down"
                      :rounded="0"
                      variant="text"
                      class="bg-white"
                      v-if="cLayout.type === 'horizontal' || cLayout.panes[idx].panes.length === 0"
                      :data-idx="idx"
                      data-direction="down"
                      @click="addPane"
                      @mouseenter="onMouseEnter"
                      @mouseleave="onMouseLeave"
                    ></v-btn>
                  </v-col>
                </v-row>
              </v-container>
            </v-menu>
            <template v-if="(cLayout.panes?.length || 0) > 1">
              <v-spacer />
              <v-btn
                size="x-small"
                icon="mdi-close"
                :data-idx="idx"
                @click="removePane"
                @mouseenter="onMouseEnter"
                @mouseleave="onMouseLeave"
              />
            </template>
          </div>
        </v-sheet>
        <SplitPanesLayer :key="pane.uuid" :layout="pane" :root-layout="layout" :is-nest="true" :show-bar="showBar" />
      </div>
    </pane>
  </splitpanes>
  <Sample :key="cLayout.uuid" v-else />
</template>

<style scoped lang="css">

</style>
<style deep lang="css">
.splitpanes.root {
  height: calc(100vh - 64px) !important;
  /*background-image: linear-gradient(-45deg, #eea2a2 0%, #bbc1bf 19%, #57c6e1 42%, #b49fda 79%, #7ac5d8 100%);*/
  background-image: linear-gradient(-45deg, #d5dee7 0%, #ffafbd 0%, #c9ffbf 100%);
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

.split-panes-layer.on-hold {
  outline: 6px solid red;
  outline-offset: -6px;
}

.split-panes-layer.on-hold-up {
  box-shadow: 0 6px 0 0 red inset;
}

.split-panes-layer.on-hold-down {
  box-shadow: 0 -6px 0 0 red inset;
}

.split-panes-layer.on-hold-left {
  box-shadow: 6px 0 0 0 red inset;
}

.split-panes-layer.on-hold-right {
  box-shadow: -6px 0 0 0 red inset;
}
</style>
