<script lang='ts'>
import { defineComponent } from '@vue/runtime-core'

export default defineComponent({})
//noinspection JSUnusedGlobalSymbols
export const componentInfo = {
  name : 'GeneralBord',
  label: '汎用プレイボード（仮）',
}
</script>

<script setup lang='ts'>
import { computed, onMounted, ref, watch } from 'vue'
import { Layout } from '~/components/panes'

const props = defineProps<{
  layout: Layout
  rootLayout: Layout
}>()

type Location = { x: number, y: number }
type MoveInfo = { mode: 'none' | 'moving', moveZ: number, mStart: Location, mNow: Location, cStart: Location, cNow: Location }
const initMoveInfo: MoveInfo = {
  mode  : 'none',
  moveZ : 0,
  mStart: {
    x: 0,
    y: 0,
  },
  mNow  : {
    x: 0,
    y: 0,
  },
  cStart: {
    x: 0,
    y: 0,
  },
  cNow  : {
    x: 0,
    y: 0,
  },
}

const gridSize   = ref(50)
const gridRow    = ref(10)
const gridColumn = ref(15)

const viewHelp = ref(true)

const canvas = ref<HTMLCanvasElement>()
const root   = ref<HTMLElement>()

const positionMarkerDeg  = ref(0)
const positionMarkerSize = ref(0)

const moveInfo = ref<MoveInfo>(initMoveInfo)

const changeWheel = (wheelDiff: number): { ratio: number, canvasCenter: Location } | null => {
  const afterMoveZ = moveInfo.value.moveZ + wheelDiff
  if (afterMoveZ <= -1000 || 1000 <= afterMoveZ) {
    return null
  }

  const ratio = wheelDiff / 1000

  const rootRect     = root.value?.getBoundingClientRect()!
  const canvasRect   = canvas.value?.getBoundingClientRect()!
  const rootCenter   = {
    x: rootRect.x + rootRect.width / 2,
    y: rootRect.y + rootRect.height / 2,
  }
  const canvasCenter = {
    x: canvasRect.x + canvasRect.width / 2,
    y: canvasRect.y + canvasRect.height / 2,
  }

  const diffRoot = {
    x: canvasCenter.x - rootCenter.x,
    y: canvasCenter.y - rootCenter.y,
  }

  moveInfo.value.cNow.x += diffRoot.x * ratio
  moveInfo.value.cNow.y += diffRoot.y * ratio
  moveInfo.value.moveZ = afterMoveZ

  return {
    ratio,
    canvasCenter,
  }
}

const onWheel = (event: WheelEvent) => {
  const wheelDiff = event.deltaY > 0 ? 100 : -100

  const result = changeWheel(wheelDiff)
  if (!result) {
    return
  }

  const diffMouse = {
    x: result.canvasCenter.x - event.clientX,
    y: result.canvasCenter.y - event.clientY,
  }

  moveInfo.value.cNow.x -= diffMouse.x * result.ratio
  moveInfo.value.cNow.y -= diffMouse.y * result.ratio
}

const hideMagnification = ref(true)

watch(() => moveInfo.value.moveZ, () => {
  hideMagnification.value = false
  setTimeout(() => {
    hideMagnification.value = true
  }, 2000)
}, { immediate: true })

watch(() => moveInfo.value.cNow, () => {
  const rootRect   = root.value?.getBoundingClientRect()!
  const canvasRect = canvas.value?.getBoundingClientRect()!

  const rootCenter   = {
    x: rootRect.x + rootRect.width / 2,
    y: rootRect.y + rootRect.height / 2,
  }
  const canvasCenter = {
    x: canvasRect.x + canvasRect.width / 2,
    y: canvasRect.y + canvasRect.height / 2,
  }

  const diff = {
    x: rootCenter.x - canvasCenter.x,
    y: rootCenter.y - canvasCenter.y,
  }
  const deg  = 180 / Math.PI

  const distance = Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2))
  const diagonal = Math.sqrt(Math.pow(canvasRect.width, 2) + Math.pow(canvasRect.height, 2))

  positionMarkerDeg.value  = 180 + Math.atan2(diff.y, diff.x) * deg
  positionMarkerSize.value = Math.max((
                                        distance - diagonal / 2
                                      ) * 0.3 + 10, 0)
}, { deep: true })

const onStartMove = (event: MouseEvent) => {
  moveInfo.value.mode     = 'moving'
  moveInfo.value.mStart.x = event.clientX
  moveInfo.value.mStart.y = event.clientY
  moveInfo.value.cStart.x = moveInfo.value.cNow.x
  moveInfo.value.cStart.y = moveInfo.value.cNow.y
}

const onMove = (event: MouseEvent) => {
  if (moveInfo.value.mode !== 'moving') {
    return
  }

  moveInfo.value.mNow.x = event.clientX
  moveInfo.value.mNow.y = event.clientY

  const diffX = moveInfo.value.mNow.x - moveInfo.value.mStart.x
  const diffY = moveInfo.value.mNow.y - moveInfo.value.mStart.y

  moveInfo.value.cNow.x = moveInfo.value.cStart.x + diffX + diffX * moveInfo.value.moveZ / 1000
  moveInfo.value.cNow.y = moveInfo.value.cStart.y + diffY + diffY * moveInfo.value.moveZ / 1000
}

const moveCanvas = (direction: 'left' | 'right' | 'up' | 'down') => {
  const distance = gridSize.value
  switch (direction) {
    case 'left':
      moveInfo.value.cNow.x += distance
      break
    case 'right':
      moveInfo.value.cNow.x -= distance
      break
    case 'up':
      moveInfo.value.cNow.y += distance
      break
    default:
      moveInfo.value.cNow.y -= distance
  }
}

const drawer = ref(false)

const onEndMove = () => {
  moveInfo.value.mode = 'none'
}

defineExpose({
               globalKeyDown: (event: KeyboardEvent) => {
                 const key      = event.key;
                 const shiftKey = event.shiftKey;
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
                   changeWheel(-100)
                   return
                 }
                 if (key === 'S' || key === 'ArrowDown' && shiftKey) {
                   changeWheel(100)
                   return
                 }
               },
             })

const gridSizeInput   = ref<any>(null)
const gridColumnInput = ref<any>(null)
const gridRowInput    = ref<any>(null)
watch(drawer, () => {
  if (drawer.value) {
    setTimeout(() => {
      const inputElm = gridSizeInput.value?.$el.getElementsByTagName('input')
      inputElm[0]?.focus()
    })
  }
})
const closeDrawer   = (event: KeyboardEvent) => {
  const elm = event.target as HTMLElement
  elm.blur()
  drawer.value = false
}
const magnification = computed(() => (
  1 - moveInfo.value.moveZ / 1000
).toFixed(1))

const paneBgColor   = ref('#ffffff')
const canvasBgColor = ref('#ffffff')
const borderColor   = ref('#000000')

const paneStrColor = computed(() => '#'.concat(Array(3)
                                                 .fill(0)
                                                 .map((_, x) => paneBgColor.value.substring(x * 2 + 1, x * 2 + 3))
                                                 .map(x => 255 - parseInt(x, 16))
                                                 .map(x => x.toString(16).padStart(2, '0')).join('')))

const navDrawerList = ref<any>(null)
onMounted(() => {
  const navDrawerElm = navDrawerList.value.$el
  Array.from(navDrawerElm.querySelectorAll('button')).forEach((btnElm: any) => btnElm.parentNode.removeChild(btnElm))
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
</script>

<template>
  <v-layout
    class='general-bord'
    :style='{ "--pane-bg-color": paneBgColor, "--pane-text-color": paneStrColor }'
  >
    <v-app-bar prominent elevation='1' density='compact'>
      <v-app-bar-nav-icon variant='text' @click.stop='drawer = !drawer' @keydown.enter.stop></v-app-bar-nav-icon>

      <v-toolbar-title>汎用プレイボード（仮）</v-toolbar-title>

      <v-spacer></v-spacer>

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
        <v-list-subheader>ボードサイズ</v-list-subheader>
        <v-list-item>
          <v-text-field
            label='マスの大きさ'
            type='number'
            v-model='gridSize'
            suffix='px'
            @keydown.esc.stop='closeDrawer'
            @keydown.stop
            :hide-details='true'
            :disabled='!drawer'
            ref='gridSizeInput'
          />
        </v-list-item>
        <v-list-item>
          <v-text-field
            label='マス数（横）'
            type='number'
            v-model='gridColumn'
            @keydown.esc.stop='closeDrawer'
            @keydown.stop
            :hide-details='true'
            :disabled='!drawer'
            ref='gridColumnInput'
          />
        </v-list-item>
        <v-list-item>
          <v-text-field
            label='マス数（縦）'
            type='number'
            v-model='gridRow'
            @keydown.esc.stop='closeDrawer'
            @keydown.stop
            :hide-details='true'
            :disabled='!drawer'
            ref='gridRowInput'
          />
        </v-list-item>
        <v-divider class='my-2' />
        <v-list-subheader>カラー</v-list-subheader>
        <v-list-item>
          背景色（ペイン）
          <v-color-picker
            v-model='paneBgColor'
            :hide-canvas='false'
            :hide-inputs='false'
            :show-swatches='false'
            mode='hexa'
            :disabled='!drawer'
            ref='colorPicker1'
          />
        </v-list-item>
        <v-list-item>
          背景色（ボード）
          <v-color-picker
            v-model='canvasBgColor'
            :hide-canvas='false'
            :hide-inputs='false'
            :show-swatches='false'
            mode='hexa'
            :disabled='!drawer'
            ref='colorPicker2'
          />
        </v-list-item>
        <v-list-item>
          罫線（ボード）
          <v-color-picker
            v-model='borderColor'
            :hide-canvas='false'
            :hide-inputs='false'
            :show-swatches='false'
            mode='hexa'
            :disabled='!drawer'
            ref='colorPicker3'
          />
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <div class='position-absolute ma-2' style='left: 0; top: 48px;' v-if='viewHelp'>
      [w][a][s][d] or 十字キー：カメラ移動<br>
      [W] or [Shift + ↑]：拡大<br>
      [S] or [Shift + ↓]：縮小
    </div>

    <div class='position-absolute magnification ma-2' style='right: 0; top: 48px;' :class='{hideMagnification}'>
      倍率: {{ magnification }}
    </div>

    <div
      class='general-bord-container fill-height d-flex w-100'
      @wheel='onWheel'
      :style='{
        "--move-x": `${moveInfo.cNow.x}px`,
        "--move-y": `${moveInfo.cNow.y}px`,
        "--move-z": `${-moveInfo.moveZ}px`,
        "--position-marker-deg": `${positionMarkerDeg}deg`,
        "--position-marker-size": `${positionMarkerSize}px`,
        "--canvas-bg-color": canvasBgColor,
        "--canvas-border-color": borderColor,
        "--grid-size": gridSize,
        "--grid-row": gridRow,
        "--grid-column": gridColumn,
      }'
      @mousedown='onStartMove'
      @mouseleave='onEndMove()'
      @mouseup='onEndMove()'
      @mousemove='onMove'
      ref='root'
    >
      <v-icon icon='mdi-pan-right' class='center-direct'></v-icon>

      <div class='canvas-background'>
        <canvas
          :width='gridSize * gridColumn'
          :height='gridSize * gridRow'
          ref='canvas'
        ></canvas>
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

.general-bord-container {
  perspective: 1000px;
  position: relative;
  overflow: hidden;
}

/*noinspection CssUnresolvedCustomProperty*/
.general-bord-container .canvas-background {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(var(--grid-size) * var(--grid-column) * 1px);
  height: calc(var(--grid-size) * var(--grid-row) * 1px);
  border-top: 1px solid var(--canvas-border-color);
  border-right: 1px solid var(--canvas-border-color);
  transform: translate3d(calc(-50% + var(--move-x)), calc(-50% + var(--move-y)), var(--move-z));
}

/*noinspection CssUnresolvedCustomProperty*/
.general-bord-container .canvas-background canvas {
  width: 100%;
  height: 100%;
  background-position: 50% 50%;
  background-size: calc(var(--grid-sze) * 1px) calc(var(--grid-sze) * 1px);
  background-color: var(--canvas-bg-color);
  background-image: repeating-linear-gradient(
    90deg,
    var(--canvas-border-color),
    var(--canvas-border-color) 1px,
    transparent 1px,
    transparent calc(var(--grid-size) * 1px)
  ),
  repeating-linear-gradient(
    0deg,
    var(--canvas-border-color),
    var(--canvas-border-color) 1px,
    transparent 1px,
    transparent calc(var(--grid-size) * 1px)
  );
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