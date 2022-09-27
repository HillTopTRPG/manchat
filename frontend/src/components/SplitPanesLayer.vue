<script setup lang='ts'>
import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { ref } from 'vue'
import { uuid } from 'vue-uuid'
import { componentMap, Layout } from './panes'

interface Props {
  layout: Layout
  rootLayout: Layout
  isNest?: boolean
  showBar?: boolean
  componentTarget?: string
}

const props = withDefaults(defineProps<Props>(), {
  isNest         : false,
  showBar        : true,
  componentTarget: '',
})

const cLayout = ref(props.layout)

const addChildPane = (idx: number, isAfter: boolean) => {
  if (!cLayout.value.panes) {
    return
  }
  if (!isAfter) {
    cLayout.value.panes[idx].panes.push({
                                          type   : 'normal',
                                          uuid   : uuid.v4(),
                                          panes  : [],
                                          payload: null,
                                        })
  }
  if (cLayout.value.panes[idx].type !== 'horizontal' && cLayout.value.panes[idx].type !== 'vertical') {
    cLayout.value.panes[idx].type = cLayout.value.type === 'horizontal' ? 'vertical' : 'horizontal'
    const sUuid                   = cLayout.value.panes[idx].uuid
    cLayout.value.panes[idx].uuid = uuid.v4()
    cLayout.value.panes[idx].panes.push({
                                          type          : 'normal',
                                          uuid          : sUuid,
                                          panes         : [],
                                          componentGroup: cLayout.value.panes[idx].componentGroup,
                                          component     : cLayout.value.panes[idx].component,
                                          payload       : null,
                                        })
    cLayout.value.panes[idx].component = ''
  }
  if (isAfter) {
    cLayout.value.panes[idx].panes.push({
                                          type   : 'normal',
                                          uuid   : uuid.v4(),
                                          panes  : [],
                                          payload: null,
                                        })
  }
}

const addPane = (event: { target: HTMLElement }) => {
  const btnElm: HTMLElement = event.target.tagName === 'button' ? event.target : event.target.closest('button')!
  const idx                 = parseInt(btnElm.dataset.idx || '0')
  const direction           = btnElm.dataset.direction
  Array.from(document.getElementsByClassName('split-panes-layer'))
       .find((elm: Element) => (
                                 elm as HTMLElement
                               ).dataset.uuid === cLayout.value.panes[idx].uuid)
       ?.classList.remove(`on-hold-${direction}`)
  if (cLayout.value.type === 'horizontal') {
    if (direction === 'up' || direction === 'down') {
      addBrotherPane(idx, direction === 'down')
    } else {
      if (cLayout.value.panes[idx].panes.length === 0) {
        addChildPane(idx, direction === 'right')
      }
    }
  }
  if (cLayout.value.type === 'vertical') {
    if (direction === 'left' || direction === 'right') {
      addBrotherPane(idx, direction === 'right')
    } else {
      if (cLayout.value.panes[idx].panes.length === 0) {
        addChildPane(idx, direction === 'down')
      }
    }
  }
}

const showBorderSelf = (event: { target: HTMLElement }) => {
  const btnElm: HTMLElement = event.target.tagName === 'button' ? event.target : event.target.closest('button')!
  const idx                 = parseInt(btnElm.dataset.idx || '0')
  const direction           = btnElm.dataset.direction
  Array.from(document.getElementsByClassName('splitpanes__pane'))
       .find((elm: Element) => (
                                 elm as HTMLElement
                               ).dataset.uuid === cLayout.value.panes[idx].uuid)
       ?.classList.add(direction ? `on-hold-${direction}` : 'on-hold')
}

const hideBorderSelf = (event: { target: HTMLElement }) => {
  const btnElm: HTMLElement = event.target.tagName === 'button' ? event.target : event.target.closest('button')!
  const idx                 = parseInt(btnElm.dataset.idx || '0')
  const direction           = btnElm.dataset.direction
  Array.from(document.getElementsByClassName('splitpanes__pane'))
       .find((elm: Element) => (
                                 elm as HTMLElement
                               ).dataset.uuid === cLayout.value.panes[idx].uuid)
       ?.classList.remove(direction ? `on-hold-${direction}` : 'on-hold')
}

const showBorderChildren = (event: { target: HTMLElement }) => {
  const btnElm: HTMLElement = event.target.tagName === 'button' ? event.target : event.target.closest('button')!
  const idx                 = parseInt(btnElm.dataset.idx || '0')
  Array.from(document.getElementsByClassName('splitpanes__pane'))
       .filter((elm: Element) => cLayout.value.panes[idx].panes.map(p => p.uuid).some(uuid => uuid ===
                                                                                              (
                                                                                                elm as HTMLElement
                                                                                              ).dataset.uuid))
       .forEach(elm => elm.classList.add('on-hold'))
}

const hideBorderChildren = (event: { target: HTMLElement }) => {
  const btnElm: HTMLElement = event.target.tagName === 'button' ? event.target : event.target.closest('button')!
  const idx                 = parseInt(btnElm.dataset.idx || '0')
  Array.from(document.getElementsByClassName('splitpanes__pane'))
       .filter((elm: Element) => cLayout.value.panes[idx].panes.map(p => p.uuid).some(uuid => uuid ===
                                                                                              (
                                                                                                elm as HTMLElement
                                                                                              ).dataset.uuid))
       .forEach(elm => elm.classList.remove('on-hold'))
}

const addBrotherPane = (idx: number, isAfter: boolean) => {
  const addObj: Layout = {
    type   : 'normal',
    uuid   : uuid.v4(),
    panes  : [],
    payload: null,
  }
  cLayout.value.panes.splice(idx +
                             (
                               isAfter ? 1 : 0
                             ), 0, addObj)
  cLayout.value.panes.forEach(p => p.size = 100 / cLayout.value.panes.length)
}

const removePane = (event: { target: HTMLElement }) => {
  hideBorderSelf(event)
  const btnElm: HTMLElement = event.target.tagName === 'button' ? event.target : event.target.closest('button')!
  const idx                 = parseInt(btnElm.dataset.idx || '0')
  if (!cLayout.value.panes) {
    return
  }
  if (cLayout.value.panes.length === 2 && cLayout.value.uuid !== props.rootLayout.uuid) {
    const remain                 = cLayout.value.panes[idx === 0 ? 1 : 0]
    cLayout.value.panes          = remain.panes
    cLayout.value.uuid           = remain.uuid
    cLayout.value.type           = remain.type
    cLayout.value.component      = remain.component
    cLayout.value.componentGroup = remain.componentGroup
  } else {
    cLayout.value.panes.splice(idx, 1)
  }
}

const onResizedPanes = (event: { size: number }[]) => event.forEach(({ size }, idx) => cLayout.value.panes[idx].size
  = size)
</script>

<template>
  <splitpanes
    class='flex-fill'
    :class="isNest ? null : 'root'"
    :horizontal="cLayout.type === 'horizontal' || undefined"
    :key='cLayout.uuid'
    v-if="cLayout.type === 'horizontal' || cLayout.type === 'vertical'"
    @resized='onResizedPanes'
    :dbl-click-splitter='false'
  >
    <pane
      v-for='(pane, idx) in cLayout.panes'
      :key='idx'
      class='d-flex justify-start align-start'
      :class="(pane.type !== 'horizontal' && pane.type !== 'vertical') ? 'last-generation' : null"
      :style="{ 'overflow': (pane.type === 'horizontal' || pane.type === 'vertical') ? 'hidden' : 'auto' }"
      :size='pane.size === undefined ? 100 - (cLayout.panes.reduce((p, c) => (c.size || 0) + p, 0)) : pane.size'
      :data-uuid='pane.uuid'
      min-size='5'
    >
      <div
        class='split-panes-layer d-flex w-100 h-100'
        :data-uuid='pane.uuid'
        :class="[
          cLayout.type === 'horizontal' && (pane.type === 'horizontal' || pane.type === 'vertical') ? 'flex-row' : 'flex-column',
          isNest ? 'flex-fill' : 'root'
        ]"
      >
        <v-sheet
          class='d-flex px-1 py-1'
          style='box-sizing: border-box; background-color: rgba(255, 255, 255, 0.1);'
          :class="cLayout.type === 'horizontal' && (pane.type === 'horizontal' || pane.type === 'vertical') ? 'flex-column' : 'flex-row'"
          v-if='showBar'
        >
          <div
            class='position-sticky d-flex'
            :class="cLayout.type === 'horizontal' && (pane.type === 'horizontal' || pane.type === 'vertical') ? 'flex-column h-100 py-5' : 'flex-row w-100 px-5'"
            style='gap: 1em; top: 0; left: 0;'
          >
            <template v-if="pane.type === 'horizontal' || pane.type === 'vertical'">
              <v-btn
                size='x-small'
                icon='mdi-view-split-vertical'
                :data-idx='idx'
                v-if="pane.type !== 'horizontal'"
                @click="pane.type = 'horizontal'"
                @mouseenter='showBorderChildren'
                @mouseleave='hideBorderChildren'
              ></v-btn>
              <v-btn
                size='x-small'
                icon='mdi-view-split-horizontal'
                :data-idx='idx'
                v-if="pane.type !== 'vertical'"
                @click="pane.type = 'vertical'"
                @mouseenter='showBorderChildren'
                @mouseleave='hideBorderChildren'
              ></v-btn>
            </template>
            <v-menu location='center'>
              <template #activator='{ props: menu }'>
                <v-btn size='x-small' color='primary' v-bind='menu' icon='mdi-plus' />
              </template>
              <v-container class='text-center'>
                <v-row>
                  <v-col class='pa-0'>
                    <v-btn
                      icon='mdi-chevron-up'
                      :rounded='0'
                      variant='text'
                      class='bg-white border-opacity-50'
                      v-if="cLayout.type === 'horizontal' || cLayout.panes[idx].panes.length === 0"
                      :data-idx='idx'
                      data-direction='up'
                      @click='addPane'
                      @mouseenter='showBorderSelf'
                      @mouseleave='hideBorderSelf'
                    />
                  </v-col>
                </v-row>
                <v-row class='my-3'>
                  <v-col class='pa-0'>
                    <v-btn
                      icon='mdi-chevron-left'
                      :rounded='0'
                      variant='text'
                      class='bg-white'
                      v-if="cLayout.type === 'vertical' || cLayout.panes[idx].panes.length === 0"
                      :data-idx='idx'
                      data-direction='left'
                      @click='addPane'
                      @mouseenter='showBorderSelf'
                      @mouseleave='hideBorderSelf'
                    ></v-btn>
                  </v-col>
                  <v-col class='pa-0'>
                    <v-btn
                      icon=''
                      v-ripple='false'
                      :rounded='0'
                      variant='plain'
                    ></v-btn>
                  </v-col>
                  <v-col class='pa-0'>
                    <v-btn
                      icon='mdi-chevron-right'
                      :rounded='0'
                      variant='text'
                      class='bg-white'
                      v-if="cLayout.type === 'vertical' || cLayout.panes[idx].panes.length === 0"
                      :data-idx='idx'
                      data-direction='right'
                      @click='addPane'
                      @mouseenter='showBorderSelf'
                      @mouseleave='hideBorderSelf'
                    ></v-btn>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col class='pa-0'>
                    <v-btn
                      icon='mdi-chevron-down'
                      :rounded='0'
                      variant='text'
                      class='bg-white'
                      v-if="cLayout.type === 'horizontal' || cLayout.panes[idx].panes.length === 0"
                      :data-idx='idx'
                      data-direction='down'
                      @click='addPane'
                      @mouseenter='showBorderSelf'
                      @mouseleave='hideBorderSelf'
                    ></v-btn>
                  </v-col>
                </v-row>
              </v-container>
            </v-menu>
            <v-menu
              v-if="pane.type !== 'horizontal' && pane.type !== 'vertical' && pane.component"
              :close-on-content-click='false'
            >
              <template #activator='{ props: menu }'>
                <v-btn size='x-small' color='secondary' v-bind='menu' icon='mdi-package-variant-closed' />
              </template>
              <v-list density='compact'>
                <template
                  v-for='g in componentMap'
                  :key='g.group'
                >
                  <v-list-group v-if='g.group'>
                    <template #activator='{ props }'>
                      <v-list-item v-bind='props' :title='g.group' />
                    </template>

                    <v-list-item
                      v-for='n in Object.keys(g.items)'
                      :title='n'
                      :value='n'
                      :active='n === pane.component && g.group === pane.componentGroup'
                      @click='pane.component = n; pane.componentGroup = g.group'
                    />
                  </v-list-group>
                  <template v-else>
                    <v-list-item
                      v-for='n in Object.keys(g.items)'
                      :title='n'
                      :value='n'
                      :active='n === pane.component && g.group === pane.componentGroup'
                      @click='pane.component = n; pane.componentGroup = g.group'
                    />
                  </template>
                </template>
              </v-list>
            </v-menu>
            <template v-if='(cLayout.panes?.length || 0) > 1'>
              <v-spacer />
              <v-btn
                size='x-small'
                icon='mdi-close'
                :data-idx='idx'
                @click='removePane'
                @mouseenter='showBorderSelf'
                @mouseleave='hideBorderSelf'
              />
            </template>
          </div>
        </v-sheet>
        <!--suppress HtmlUnknownTag -->
        <SplitPanesLayer
          :key='pane.uuid'
          :layout='pane'
          :root-layout='layout'
          :is-nest='true'
          :show-bar='showBar'
          :component-target='pane.component'
        />
      </div>
    </pane>
  </splitpanes>
  <keep-alive v-else-if='cLayout.component'>
    <component
      :is='componentMap.find(p => p.group === cLayout.componentGroup)?.items[cLayout.component]'
      :layout='cLayout'
    />
  </keep-alive>
  <v-list v-else density='compact'>
    <template
      v-for='g in componentMap'
      :key='g.group'
    >
      <v-list-group v-if='g.group'>
        <template #activator='{ props }'>
          <v-list-item v-bind='props' :title='g.group' />
        </template>

        <v-list-item
          v-for='n in Object.keys(g.items)'
          :title='n'
          :value='n'
          @click='cLayout.component = n; cLayout.componentGroup = g.group'
        />
      </v-list-group>
      <template v-else>
        <v-list-item
          v-for='n in Object.keys(g.items)'
          :title='n'
          :value='n'
          @click='cLayout.component = n; cLayout.componentGroup = g.group'
        />
      </template>
    </template>
  </v-list>
</template>

<!--suppress HtmlUnknownAttribute, CssUnusedSymbol -->
<style deep lang='css'>
.splitpanes.root {
  height: 100%;
  background: rgb(var(--v-theme-surface));
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
}

.splitpanes__pane.last-generation {
  background-color: rgba(255, 255, 255, 0.3);
}

.splitpanes--vertical > .splitpanes__splitter {
  min-width: 7px;
  background: linear-gradient(90deg, #cccccc, #111111);
}

.splitpanes--horizontal > .splitpanes__splitter {
  min-height: 7px;
  background: linear-gradient(#cccccc, #111111);
}

.splitpanes__pane.on-hold,
.split-panes-layer.on-hold {
  outline: 6px solid red;
  outline-offset: -6px;
}

.splitpanes__pane.on-hold-up,
.split-panes-layer.on-hold-up {
  border-top: 6px solid red;
}

.splitpanes__pane.on-hold-down,
.split-panes-layer.on-hold-down {
  border-bottom: 6px solid red;
}

.splitpanes__pane.on-hold-left,
.split-panes-layer.on-hold-left {
  border-left: 6px solid red;
}

.splitpanes__pane.on-hold-right,
.split-panes-layer.on-hold-right {
  border-right: 6px solid red;
}

.v-select__selection-text {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
}
</style>
