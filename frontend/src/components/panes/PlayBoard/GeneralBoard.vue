<script lang='ts'>
import { defineComponent } from '@vue/runtime-core'

export default defineComponent({})
//noinspection JSUnusedGlobalSymbols
export const componentInfo = {
  name : 'GeneralBoard',
  label: '汎用プレイボード（仮）',
}

export class Location {
  public x: number
  public y: number

  constructor(x: number = 0, y: number = 0) {
    this.x = x
    this.y = y
  }

  public toString() {
    return `{x: ${this.x}, y: ${this.y}}`
  }
}

export type MoveInfo = {
  mode: string, subMode: '' | 'moving', mStart: Location, mNow: Location, cStart: Location, cNow: Location, mc: Location, mcStart: Location, mGrid: Location, mGridStart: Location, cursor: string, toolType: 'grid' | 'line' | 'shape'
}
</script>

<script setup lang='ts'>
import { computed, inject, onMounted, ref, watch } from 'vue'
import { Layout } from '~/components/panes'
import { AddIn } from '~/components/panes/PlayBoard/add-in'
import {
  InjectionKeySymbol as roomCollectionsKey, StoreType as RoomCollectionStore,
} from '~/data/RoomCollections'
import axios from 'axios'
import { merge } from 'lodash'

const store = inject(roomCollectionsKey) as RoomCollectionStore
const addIn = new AddIn()

const props = defineProps<{
  layout: Layout
  rootLayout: Layout
}>()

const initMoveInfo: MoveInfo = {
  mode      : '',
  subMode   : '',
  mStart    : new Location(),
  mNow      : new Location(),
  cStart    : new Location(),
  cNow      : new Location(),
  mc        : new Location(),
  mcStart   : new Location(),
  mGrid     : new Location(),
  mGridStart: new Location(),
  cursor    : 'default',
  toolType  : 'grid',
}

const currentBoardUuid = ref<string>(store.playBoards.value[0]?.uuid || '')
const gridRow          = computed(() => store.playBoards.value.find(pb => pb.uuid === currentBoardUuid.value)?.height ||
                                        0)
const gridColumn       = computed(() => store.playBoards.value.find(pb => pb.uuid === currentBoardUuid.value)?.width ||
                                        0)
const boardType        = computed(() => store.playBoards.value.find(pb => pb.uuid ===
                                                                          currentBoardUuid.value)?.board_type ||
                                        'normal')
const sqrt3            = Math.sqrt(3)
const getCanvasWidth   = (gridSize: number) => {
  switch (boardType.value) {
    case 'hex-vertical':
      const a = gridColumn.value * 3 + 1
      return a * gridSize / 2 / sqrt3 + 1
    default:
      return gridColumn.value * gridSize + 1
  }
}
const getCanvasHeight  = (gridSize: number) => {
  switch (boardType.value) {
    case 'hex-horizontal':
      const a = gridRow.value * 3 + 1
      return a * gridSize / 2 / sqrt3 + 1
    default:
      return gridRow.value * gridSize + 1
  }
}
const paneBgColor      = computed(() => store.playBoards.value.find(pb => pb.uuid ===
                                                                          currentBoardUuid.value)?.screen_color || '')
const canvasBgColor    = computed(() => store.playBoards.value.find(pb => pb.uuid ===
                                                                          currentBoardUuid.value)?.bg_color || '')
const borderColor      = computed(() => store.playBoards.value.find(pb => pb.uuid ===
                                                                          currentBoardUuid.value)?.border_color || '')

watch([currentBoardUuid, gridRow, gridColumn, borderColor], () => setTimeout(paint))

type CanvasInfo = { gridSize: number }
const baseGridSize     = 50
const gridChangeValue  = 5
const canvasNum        = 19
const currentCanvasIdx = ref(Math.floor(canvasNum / 2))

const canvasInfoList: CanvasInfo[] = Array(canvasNum)
  .fill(0)
  .map((_, idx) => baseGridSize + idx * gridChangeValue - Math.floor(canvasNum / 2) * gridChangeValue)
  .map(gridSize => (
    { gridSize }
  ))

const viewHelp = ref(true)

const canvas = ref<any>()
const root   = ref<HTMLElement>()

const positionMarkerDeg  = ref(0)
const positionMarkerSize = ref(0)

const moveInfo = ref<MoveInfo>(initMoveInfo)

const hideMagnification     = ref(false)
const showMagnificationTime = 2000

const changeWheel = (wheelDiff: number) => {
  const afterIndex = currentCanvasIdx.value + Math.sign(wheelDiff) * -1
  if (afterIndex < 0 && wheelDiff > 0 || canvasNum <= afterIndex && wheelDiff < 0) {
    return
  }
  const gridSize = canvasInfoList[afterIndex].gridSize
  const ratio    = gridSize / canvasInfoList[currentCanvasIdx.value].gridSize

  const rootRect   = root.value?.getBoundingClientRect()!
  const diffMouseX = moveInfo.value.mNow.x - rootRect.x - rootRect.width / 2 - moveInfo.value.cNow.x
  const diffMouseY = moveInfo.value.mNow.y - rootRect.y - rootRect.height / 2 - moveInfo.value.cNow.y

  moveInfo.value.cNow.x -= diffMouseX * ratio - diffMouseX
  moveInfo.value.cNow.y -= diffMouseY * ratio - diffMouseY
  moveInfo.value.mc.x *= ratio
  moveInfo.value.mc.y *= ratio

  currentCanvasIdx.value = afterIndex

  paint()

  hideMagnification.value = false
  setTimeout(() => {
    hideMagnification.value = true
  }, showMagnificationTime)
}

const onWheel = (event: WheelEvent) => {
  moveInfo.value.mNow.x = event.clientX
  moveInfo.value.mNow.y = event.clientY
  changeWheel(event.deltaY)
}

watch(() => moveInfo.value.cNow, () => {
  const gridSize    = canvasInfoList[currentCanvasIdx.value].gridSize
  const minSideSize = gridSize * Math.min(gridRow.value, gridColumn.value)
  const deg         = 180 / Math.PI

  const correctionValue = 0.3

  const distance           = Math.hypot(moveInfo.value.cNow.x, moveInfo.value.cNow.y)
  const diagonal           = Math.hypot(minSideSize, minSideSize)
  positionMarkerDeg.value  = Math.atan2(moveInfo.value.cNow.y, moveInfo.value.cNow.x) * deg
  positionMarkerSize.value = Math.max(distance * correctionValue - diagonal / 2 * correctionValue, 0)
}, { deep: true })

const isMouseOnCanvas = (): boolean => {
  if (moveInfo.value.mc.x < 0 || moveInfo.value.mc.y < 0) {
    return false
  }
  const gridSize     = canvasInfoList[currentCanvasIdx.value].gridSize
  const canvasWidth  = gridSize * gridColumn.value
  const canvasHeight = gridSize * gridRow.value
  return moveInfo.value.mc.x <= canvasWidth && moveInfo.value.mc.y <= canvasHeight;
}

const mapMaskColorDialog   = ref(false)
const mapMaskColorSwatches = computed(() => store.mapMasks.value
                                                 .map(mm => mm.bg_color.toUpperCase())
                                                 .filter((c, idx, self) => self.indexOf(c) === idx)
                                                 .map(c => [c]))
const addInColor           = ref(mapMaskColorSwatches.value.length
                                 ? mapMaskColorSwatches.value.slice(-1)[0][0]
                                 : '#ff00ff'.toUpperCase())
watch(mapMaskColorDialog, () => {
  if (!mapMaskColorDialog.value) {
    moveInfo.value.mode = 'add-in:add'
  }
})

const onStartMove = (event: MouseEvent) => {
  const gridSize = canvasInfoList[currentCanvasIdx.value].gridSize

  moveInfo.value.mStart.x     = event.clientX
  moveInfo.value.mStart.y     = event.clientY
  moveInfo.value.cStart.x     = moveInfo.value.cNow.x
  moveInfo.value.cStart.y     = moveInfo.value.cNow.y
  moveInfo.value.mcStart.x    = moveInfo.value.mc.x
  moveInfo.value.mcStart.y    = moveInfo.value.mc.y
  moveInfo.value.mGridStart.x = moveInfo.value.mGrid.x
  moveInfo.value.mGridStart.y = moveInfo.value.mGrid.y
  addIn.onStartMove(currentBoardUuid.value, moveInfo.value, addInColor.value, gridSize, store)
  moveInfo.value.subMode = 'moving'
}

const onMove = (event: MouseEvent) => {
  moveInfo.value.mNow.x = event.clientX
  moveInfo.value.mNow.y = event.clientY

  const gridSize = canvasInfoList[currentCanvasIdx.value].gridSize

  if (!moveInfo.value.mode && moveInfo.value.subMode === 'moving') {
    moveInfo.value.cNow.x = moveInfo.value.cStart.x + moveInfo.value.mNow.x - moveInfo.value.mStart.x
    moveInfo.value.cNow.y = moveInfo.value.cStart.y + moveInfo.value.mNow.y - moveInfo.value.mStart.y
  }

  const rootRect = root.value?.getBoundingClientRect()!
  const canvasX  = rootRect.x + rootRect.width / 2 + moveInfo.value.cNow.x - gridSize * gridColumn.value / 2
  const canvasY  = rootRect.y + rootRect.height / 2 + moveInfo.value.cNow.y - gridSize * gridRow.value / 2

  const beforeOnCanvas = isMouseOnCanvas()
  moveInfo.value.mc.x  = moveInfo.value.mNow.x - canvasX
  moveInfo.value.mc.y  = moveInfo.value.mNow.y - canvasY
  const afterOnCanvas  = isMouseOnCanvas()

  moveInfo.value.mGrid.x = Math.floor(moveInfo.value.mc.x / gridSize)
  moveInfo.value.mGrid.y = Math.floor(moveInfo.value.mc.y / gridSize)

  addIn.onMove(currentBoardUuid.value, moveInfo.value, addInColor.value, gridSize, store)

  if (beforeOnCanvas || afterOnCanvas) {
    paint()
  }
}

const onEndMove = () => {
  moveInfo.value.subMode = ''
  addIn.onEndMove(moveInfo.value, store)
}

const paint = () => {
  const context = canvas.value[currentCanvasIdx.value].getContext('2d')
  if (!context) {
    return
  }

  const gridSize = canvasInfoList[currentCanvasIdx.value].gridSize
  addIn.paint(context, gridSize, moveInfo.value, currentBoardUuid.value, store)
}

watch(store.mapMasks, () => {
  addIn.onUpdateCollection(store, 'map-mask')
  paint()
}, { deep: true })

watch(store.mapLines, () => {
  addIn.onUpdateCollection(store, 'map-line')
  paint()
}, { deep: true })

const moveCanvas = (direction: 'left' | 'right' | 'up' | 'down') => {
  const gridSize = canvasInfoList[currentCanvasIdx.value].gridSize
  switch (direction) {
    case 'left':
      moveInfo.value.cNow.x += gridSize
      moveInfo.value.mc.x -= gridSize
      break
    case 'right':
      moveInfo.value.cNow.x -= gridSize
      moveInfo.value.mc.x += gridSize
      break
    case 'up':
      moveInfo.value.cNow.y += gridSize
      moveInfo.value.mc.y -= gridSize
      break
    default:
      moveInfo.value.cNow.y -= gridSize
      moveInfo.value.mc.y += gridSize
  }

  moveInfo.value.mGrid.x = Math.floor(moveInfo.value.mc.x / gridSize)
  moveInfo.value.mGrid.y = Math.floor(moveInfo.value.mc.y / gridSize)
  addIn.onMove(currentBoardUuid.value, moveInfo.value, addInColor.value, gridSize, store)
  paint()
}

const drawer = ref(false)

defineExpose({
               globalKeyDown: (event: KeyboardEvent) => {
                 const key      = event.key
                 const shiftKey = event.shiftKey
                 if (key === 'a' || key === 'ArrowLeft') {
                   moveCanvas('left')
                   return
                 }
                 if (key === 'd' || key === 'ArrowRight') {
                   moveCanvas('right')
                   return
                 }
                 if (key === 'w' || key === 'ArrowUp' && !shiftKey) {
                   moveCanvas('up')
                   return
                 }
                 if (key === 's' || key === 'ArrowDown' && !shiftKey) {
                   moveCanvas('down')
                   return
                 }
                 if (key === 'W' || key === 'ArrowUp' && shiftKey) {
                   changeWheel(-1)
                   return
                 }
                 if (key === 'S' || key === 'ArrowDown' && shiftKey) {
                   changeWheel(1)
                   return
                 }
               },
             })

const gridColumnInput = ref<any>(null)
const gridRowInput    = ref<any>(null)
watch(drawer, () => {
  if (drawer.value) {
    setTimeout(() => {
      const inputElm = gridColumnInput.value?.$el.getElementsByTagName('input')
      inputElm[0]?.focus()
    })
  } else {
    store.updatePlayBoard(merge(store.playBoards.value.find(pb => pb.uuid === currentBoardUuid.value), {
      axios,
      play_board_uuid: currentBoardUuid.value,
    }))
  }
})
const closeDrawer = (event: KeyboardEvent) => {
  const elm = event.target as HTMLElement
  elm.blur()
  drawer.value = false
}

const paneStrColor = computed(() => '#'.concat(Array(3).fill(0)
                                                       .map((_, x) => paneBgColor.value.substring(x * 2 + 1, x * 2 + 3))
                                                       .map(x => 255 - parseInt(x, 16))
                                                       .map(x => x.toString(16).padStart(2, '0')).join('')))

const navDrawerList = ref<any>(null)
onMounted(() => {
  paint()
  setTimeout(() => hideMagnification.value = true, showMagnificationTime)

  const navDrawerElm = navDrawerList.value.$el
  setTimeout(() => {
    Array.from(navDrawerElm.querySelectorAll('.v-slider-thumb')).forEach((inputElm: any) => inputElm.tabindex = -1)
    Array.from(navDrawerElm.querySelectorAll('input:not([tabindex="-1"])')).reduce((elm1: any, elm2: any, idx, ary) => {
      // Enterで次の入力欄にフォーカスを移す
      elm1?.addEventListener('keydown', (event: KeyboardEvent) => event.key === 'Enter' && elm2.focus())
      elm2.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key !== 'Tab') {
          event.stopPropagation()
        }
        if (event.key === 'Escape' || idx === ary.length - 1 && ['Tab', 'Enter'].includes(event.key)) {
          drawer.value = false
          if (event.key === 'Tab') {
            event.preventDefault()
          }
        }
      })
      return elm2
    }, null)
  })
})

const addPlayBoard = () => {
  store.addPlayBoard({
                       axios,
                       board_type  : 'normal',
                       name        : createBoardName.value,
                       width       : createBoardWidth.value,
                       height      : createBoardHeight.value,
                       screen_color: '#ffffe0ff',
                       bg_color    : '#ffffffff',
                       border_color: '#00000033',
                       tiles       : [],
                     })
  createPlayBoardDialog.value = false
}

const createPlayBoardDialog = ref(false)
watch(createPlayBoardDialog, () => {
  if (!createPlayBoardDialog.value) {
    createBoardName.value   = 'no_title'
    createBoardWidth.value  = 15
    createBoardHeight.value = 10
  }
})
const createBoardName   = ref('no_title')
const createBoardWidth  = ref(15)
const createBoardHeight = ref(10)
const toolTypeSelect    = ref(false)

const boardTypeSelection = [
  {
    name : 'スクエア',
    value: 'normal',
  }, {
    name : 'ヘックス（縦）',
    value: 'hex-vertical',
  }, {
    name : 'ヘックス（横）',
    value: 'hex-horizontal',
  },
]
</script>

<template>
  <v-layout
    class='general-bord'
    :style='{ "--pane-bg-color": paneBgColor, "--pane-text-color": paneStrColor }'
  >
    <v-app-bar prominent elevation='1' density='compact'>
      <v-app-bar-nav-icon variant='text' @click.stop='drawer = !drawer' @keydown.enter.stop></v-app-bar-nav-icon>

      <v-select
        v-model='currentBoardUuid'
        :items='store.playBoards.value'
        item-title='name'
        item-value='uuid'
        label=''
        variant='solo'
        :single-line='true'
        density='comfortable'
        :hide-details='true'
      ></v-select>
      <v-btn icon='mdi-plus' @click='createPlayBoardDialog = true'></v-btn>
      <v-dialog v-model='createPlayBoardDialog' width='auto'>
        <v-card>
          <v-card-text>
            <v-list>
              <v-defaults-provider :defaults='{ VTextField: { hideDetails: true } }'>
                <v-list-item-title>プレイボード追加</v-list-item-title>
                <v-list-item>
                  <v-text-field label='名前' v-model='createBoardName' :autofocus='true' type='text' />
                </v-list-item>
                <v-list-item>
                  <v-text-field label='マス数（横）' v-model='createBoardWidth' type='number' />
                </v-list-item>
                <v-list-item>
                  <v-text-field label='マス数（縦）' v-model='createBoardHeight' type='number' />
                </v-list-item>
              </v-defaults-provider>
            </v-list>
          </v-card-text>
          <v-card-actions class='justify-space-around'>
            <v-btn @click='createPlayBoardDialog = false'>キャンセル</v-btn>
            <v-btn color='primary' icon='mdi-plus' @click='addPlayBoard()'>OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-spacer></v-spacer>
      <v-tooltip
        class='tooltip-form'
        :open-on-hover='false'
        :open-on-click='true'
        :close-on-back='true'
        :close-on-content-click='true'
        :offset='0'
        location='bottom'
      >
        <template #activator='{ props }'>
          <v-btn
            :icon='moveInfo.toolType === "grid" ? "mdi-rectangle" : moveInfo.toolType === "line" ? "mdi-vector-line" : "mdi-vector-polygon"'
            v-bind='props'
            @click='toolTypeSelect = !toolTypeSelect'
            @keydown.enter.stop
          />
        </template>
        <v-btn-toggle v-model='moveInfo.toolType' :borderless='false'>
          <v-btn value='grid' icon='mdi-rectangle' @keydown.enter.stop @click='toolTypeSelect = false'></v-btn>
          <v-btn value='line' icon='mdi-vector-line' @keydown.enter.stop @click='toolTypeSelect = false'></v-btn>
          <v-btn value='shape' icon='mdi-vector-polygon' @keydown.enter.stop @click='toolTypeSelect = false'></v-btn>
        </v-btn-toggle>
      </v-tooltip>

      <v-btn :color='addInColor' icon='mdi-circle' @click='mapMaskColorDialog = true' />
      <v-dialog v-model='mapMaskColorDialog' width='auto'>
        <v-card>
          <v-card-text>
            <v-color-picker
              v-model='addInColor'
              :hide-canvas='false'
              :hide-inputs='false'
              :show-swatches='true'
              :swatches='store.mapMasks.value.map(mm => mm.bg_color).filter((c, idx, arr) => arr.indexOf(c) === idx).map(c => [c])'
              :modes='["hexa"]'
              :disabled='!mapMaskColorDialog'
            />
          </v-card-text>
          <v-card-actions>
            <v-btn :block='true' @click='mapMaskColorDialog = false'>OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-btn-toggle v-model='moveInfo.mode' :borderless='true'>
        <v-defaults-provider :defaults='{VBtn: {variant: "text"}, VTooltip: { "open-on-click": false, "open-on-hover": false, location: "bottom" } }'>
          <v-tooltip class='mode-tooltip' :model-value='moveInfo.mode === "add-in:add"' :offset='0'>
            <template #activator='{ props }'>
              <v-btn
                value='add-in:add'
                icon='mdi-pencil'
                v-bind='props'
                :color='addInColor'
                @keydown.enter.stop
              />
            </template>
            <p>書き込みツール</p>
          </v-tooltip>
          <v-tooltip class='mode-tooltip' :model-value='moveInfo.mode === "add-in:move"' :offset='0'>
            <template #activator='{ props }'>
              <v-btn
                value='add-in:move'
                icon='mdi-cursor-move'
                v-bind='props'
                @keydown.enter.stop
              />
            </template>
            <p>移動ツール</p>
          </v-tooltip>
          <v-tooltip class='mode-tooltip' :model-value='moveInfo.mode === "add-in:delete"' :offset='0'>
            <template #activator='{ props }'>
              <v-btn
                value='add-in:delete'
                icon='mdi-eraser'
                v-bind='props'
                @keydown.enter.stop
              />
            </template>
            <p>消しゴムツール</p>
          </v-tooltip>
        </v-defaults-provider>
      </v-btn-toggle>

      <v-btn
        variant='text'
        icon='mdi-help'
        class='menu-btn'
        @click='viewHelp = !viewHelp'
        :class='{ active: viewHelp}'
        @keydown.enter.stop
      ></v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model='drawer' :temporary='true'>
      <v-list density='compact' ref='navDrawerList'>
        <v-defaults-provider
          :defaults='{
            VTextField: { hideDetails: true, disabled: !drawer },
            VColorPicker: { disabled: !drawer, hideCanvas: false, hideInputs: false, showSwatches: false, modes: ["hexa"] }
          }'
        >
          <v-list-subheader>基本設定</v-list-subheader>
          <v-list-item>
            <v-text-field
              label='名前'
              type='text'
              v-model='store.playBoards.value.find(pb => pb.uuid === currentBoardUuid).name'
              @keydown.esc.stop='closeDrawer'
              @keydown.stop
              ref='boardNameInput'
            />
          </v-list-item>
          <v-list-item>
            <v-select
              label='グリッドタイプ'
              v-model='store.playBoards.value.find(pb => pb.uuid === currentBoardUuid).board_type'
              @keydown.esc.stop='closeDrawer'
              @keydown.stop
              :items='boardTypeSelection'
              item-title='name'
              item-value='value'
              variant='solo'
              :single-line='true'
              density='comfortable'
              :hide-details='true'
              ref='boardTypeInput'
            >
            </v-select>
          </v-list-item>
          <v-list-item>
            <v-text-field
              label='マス数（横）'
              type='number'
              v-model='store.playBoards.value.find(pb => pb.uuid === currentBoardUuid).width'
              @keydown.esc.stop='closeDrawer'
              @keydown.stop
              ref='gridColumnInput'
            />
          </v-list-item>
          <v-list-item>
            <v-text-field
              label='マス数（縦）'
              type='number'
              v-model='store.playBoards.value.find(pb => pb.uuid === currentBoardUuid).height'
              @keydown.esc.stop='closeDrawer'
              @keydown.stop
              ref='gridRowInput'
            />
          </v-list-item>
          <v-divider class='my-2' />
          <v-list-subheader>カラー</v-list-subheader>
          <v-list-item>
            背景色（ペイン）
            <v-color-picker v-model='store.playBoards.value.find(pb => pb.uuid === currentBoardUuid).screen_color' />
          </v-list-item>
          <v-list-item>
            背景色（ボード）
            <v-color-picker v-model='store.playBoards.value.find(pb => pb.uuid === currentBoardUuid).bg_color' />
          </v-list-item>
          <v-list-item>
            罫線（ボード）
            <v-color-picker v-model='store.playBoards.value.find(pb => pb.uuid === currentBoardUuid).border_color' />
          </v-list-item>
        </v-defaults-provider>
      </v-list>
    </v-navigation-drawer>

    <div class='position-absolute ma-2' style='left: 0; top: 48px;' v-if='viewHelp'>
      [w][a][s][d] or 十字キー：視点移動<br>
      [W] or [Shift + ↑]：拡大<br>
      [S] or [Shift + ↓]：縮小
    </div>

    <div class='position-absolute magnification ma-2' style='right: 0; top: 48px;' :class='{hideMagnification}'>
      グリッドサイズ: {{ canvasInfoList[currentCanvasIdx].gridSize }}
    </div>

    <div
      class='general-bord-container fill-height d-flex w-100'
      @wheel='onWheel'
      :style='{
        "--move-x": `${moveInfo.cNow.x}px`,
        "--move-y": `${moveInfo.cNow.y}px`,
        "--position-marker-deg": `${positionMarkerDeg}deg`,
        "--position-marker-size": `${positionMarkerSize}px`,
        "--canvas-bg-color": canvasBgColor,
        "--canvas-border-color": borderColor,
        "--grid-size": canvasInfoList[currentCanvasIdx].gridSize,
        "--grid-row": gridRow,
        "--grid-column": gridColumn,
        "--mouse-on-canvas-x": moveInfo.mc.x,
        "--mouse-on-canvas-y": moveInfo.mc.y,
        "--cursor": moveInfo.cursor,
      }'
      @mousedown='onStartMove'
      @mousemove='onMove'
      @mouseup='onEndMove'
      @mouseleave='onEndMove'
      ref='root'
    >
      <v-icon icon='mdi-pan-right' class='center-direct'></v-icon>

      <div class='canvas-background'>
        <template v-for='(ci, idx) in canvasInfoList' :key='idx'>
          <canvas
            v-show='idx === currentCanvasIdx'
            :width='getCanvasWidth(ci.gridSize)'
            :height='getCanvasHeight(ci.gridSize)'
            :style='{"--grid-size": ci.gridSize}'
            ref='canvas'
          ></canvas>
        </template>
      </div>
    </div>
  </v-layout>
</template>

<!--suppress HtmlUnknownAttribute -->
<style scoped lang='css'>
/*noinspection CssUnresolvedCustomProperty*/
.general-bord {
  background-color: var(--pane-bg-color);
  color: var(--pane-text-color);
}

/*noinspection CssUnresolvedCustomProperty*/
.general-bord-container {
  position: relative;
  overflow: hidden;
  cursor: var(--cursor);
}

/*noinspection CssUnresolvedCustomProperty*/
.general-bord-container .canvas-background {
  position: absolute;
  left: 50%;
  top: 50%;
  box-sizing: content-box;
  width: calc(var(--grid-size) * var(--grid-column) * 1px);
  height: calc(var(--grid-size) * var(--grid-row) * 1px);
  transform: translate(calc(-50% + var(--move-x)), calc(-50% + var(--move-y)));
}

/*noinspection CssUnresolvedCustomProperty*/
.general-bord-container .canvas-background canvas {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--canvas-bg-color);
}

/*noinspection CssUnresolvedCustomProperty*/
.general-bord-container .canvas-background::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}

/*noinspection CssUnresolvedCustomProperty*/
.center-direct {
  position: absolute;
  left: 50%;
  top: 50%;
  font-size: var(--position-marker-size);
  transform: translate(-50%, -50%) rotate(var(--position-marker-deg));
}

/*noinspection CssUnresolvedCustomProperty*/
.menu-btn.active {
  background-color: rgb(var(--v-theme-on-surface));
  color: rgb(var(--v-theme-surface));
}

.magnification.hideMagnification {
  animation: fadein-keyframes 1s ease 0s 1 forwards;
}

@keyframes fadein-keyframes {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>

<!--suppress HtmlUnknownAttribute -->
<style deep>
.v-tooltip.tooltip-form .v-overlay__content {
  pointer-events: auto;
}

.v-tooltip.tooltip-form .v-overlay__content,
.v-tooltip.mode-tooltip .v-overlay__content {
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}
</style>