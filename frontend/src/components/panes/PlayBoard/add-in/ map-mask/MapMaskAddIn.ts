import { InjectionKeySymbol as roomCollectionsKey, StoreType as RoomCollectionStore } from '~/data/RoomCollections'
import { inject, Ref, watch } from 'vue'
import { MapMask, sendParams as mapMaskParams } from '~/data/RoomCollections/MapMask'
import axios from 'axios'
import { merge, pick } from 'lodash'

class Location {
  public x: number = 0
  public y: number = 0
}

type MoveInfo = {
  mode: string, subMode: string, mStart: Location, mNow: Location, cStart: Location, cNow: Location, mc: Location, mcStart: Location, mGrid: Location, mGridStart: Location
}

const matchLocation = (location: Location, mm: MapMask) => mm.grid_x === location.x && mm.grid_y === location.y

const getAlphaColor   = (c: string) => c.length === 7 ? `${c}66` : c.replace(/.{2}$/,
                                                                             (s) => Math.max(parseInt(s, 16) * 0.6, 20)
                                                                                        .toString(16),
)
const isEqualLocation = (p1: MapMaskLocation, p2: MapMaskLocation) => !mapMaskLocationParams.some(key => p1[key] !==
                                                                                                         p2[key])

const isEqual = (p1: MapMaskParams, p2: MapMaskParams) => !mapMaskParams.some(key => p1[key] !== p2[key])

const mapMaskLocationParams = ['grid_x', 'grid_y', 'play_board_uuid'] as const
type MapMaskLocation = Pick<MapMask, typeof mapMaskLocationParams[number]>
type MapMaskParams = Pick<MapMask, typeof mapMaskParams[number]>

export class MapMaskAddIn {
  private store: RoomCollectionStore
  private holdWriteMapMasks: MapMaskParams[]    = []
  private holdDeleteMapMasks: MapMaskLocation[] = []

  public constructor(private moveInfo: Ref<MoveInfo>,
                     private play_board_uuid: Ref<string>,
                     private color: Ref<string>,
  ) {
    this.store = inject(roomCollectionsKey) as RoomCollectionStore
    watch(this.store.mapMasks, this.onUpdateMapMasks.bind(this), { deep: true })
    watch(this.play_board_uuid, () => {
      this.holdWriteMapMasks.splice(0, this.holdWriteMapMasks.length)
      this.holdDeleteMapMasks.splice(0, this.holdDeleteMapMasks.length)
    })
  }

  private async writeMapMask(payload: MapMaskParams) {
    const useIsEqualLocation = isEqualLocation.bind(null, payload)
    const useIsEqual         = isEqual.bind(null, payload)
    if (this.holdWriteMapMasks.some(useIsEqualLocation) || this.store.mapMasks.value.some(useIsEqual)) {
      return
    }

    const updateMapMask = this.store.mapMasks.value.find(useIsEqualLocation)
    if (updateMapMask) {
      updateMapMask.bg_color = payload.bg_color
      console.log(updateMapMask.bg_color)
      this.store.updateMapMask(merge({
                                       axios,
                                       map_mask_uuid: updateMapMask.uuid,
                                     }, pick(updateMapMask, ...mapMaskParams))).then()
    } else {
      this.holdWriteMapMasks.push(payload)
      return this.store.addMapMask(merge({
                                           axios,
                                         }, payload))
    }
  }

  private async deleteMapMask(payload: MapMaskLocation) {
    const useIsEqualLocation = isEqualLocation.bind(null, payload)
    if (this.holdDeleteMapMasks.some(useIsEqualLocation) || !this.store.mapMasks.value.some(useIsEqualLocation)) {
      return
    }

    return Promise.all(this.store.mapMasks.value
                           .filter(useIsEqualLocation)
                           .map(mm => {
                             this.holdDeleteMapMasks.push(payload)
                             return this.store.deleteMapMask({
                                                               axios,
                                                               map_mask_uuid: mm.uuid,
                                                             })
                           }))
  }

  private executeDrag(subMode: string) {
    if (this.moveInfo.value.subMode !== subMode) {
      return
    }
    const base = {
      play_board_uuid: this.play_board_uuid.value,
      grid_x         : this.moveInfo.value.mGrid.x,
      grid_y         : this.moveInfo.value.mGrid.y,
      bg_color       : this.color.value,
    }
    switch (this.moveInfo.value.mode) {
      case 'add-in:map-mask:add':
        this.writeMapMask(base).then()
        break
      case 'add-in:map-mask:delete':
        this.deleteMapMask(pick(base, ...mapMaskLocationParams)).then()
        break
      default:
    }
  }

  public onStartMove() {
    this.executeDrag('')
  }

  public onMove() {
    this.executeDrag('moving')
  }

  public onEndMove(isMouseUp: boolean) {
    if (isMouseUp && this.moveInfo.value.mode === 'add-in:map-mask:move') {
      const matchList = this.store.mapMasks.value.filter(mm => matchLocation(this.moveInfo.value.mGridStart, mm))
      if (matchList.length) {
        const mm  = matchList.slice(-1)[0]
        mm.grid_x = this.moveInfo.value.mGrid.x
        mm.grid_y = this.moveInfo.value.mGrid.y
        this.store.updateMapMask(merge({
                                         axios,
                                         map_mask_uuid: mm.uuid,
                                       }, pick(mm, ...mapMaskParams))).then()
      }
    }
  }

  public onUpdateMapMasks() {
    this.holdWriteMapMasks
        .map((l, idx) => this.store.mapMasks.value.some(mm => isEqualLocation(mm, l)) ? idx : null)
        .filter((idx): idx is number => idx !== null)
        .reverse()
        .forEach(idx => this.holdWriteMapMasks.splice(idx, 1))

    this.holdDeleteMapMasks
        .map((l, idx) => this.store.mapMasks.value.some(mm => isEqualLocation(mm, l)) ? null : idx)
        .filter((idx): idx is number => idx !== null)
        .reverse()
        .forEach(idx => this.holdDeleteMapMasks.splice(idx, 1))
  }

  public paint(context: CanvasRenderingContext2D, gridSize: number) {
    let movingUuid: string | null = null
    if (this.moveInfo.value.mode === 'add-in:map-mask:move' && this.moveInfo.value.subMode === 'moving') {
      movingUuid = [...this.store.mapMasks.value]
                     .reverse()
                     .find(matchLocation.bind(null, this.moveInfo.value.mGridStart))?.uuid || null
    }

    context.font = '20px serif'

    const paintMapMask = (isStored: boolean,
                          getXY: (mm: MapMaskParams & { uuid?: string }) => Location,
                          mm: MapMaskParams & { uuid?: string },
    ) => {
      const xy = getXY(mm)

      if (this.play_board_uuid.value !== mm.play_board_uuid) {
        return
      }

      if (this.holdDeleteMapMasks.some(dmm => isEqualLocation(dmm, mm))) {
        return
      }

      context.fillStyle = movingUuid === mm.uuid ? getAlphaColor(mm.bg_color) : mm.bg_color
      context.fillRect(xy.x, xy.y, gridSize, gridSize)
      //      context.fillStyle = '#000000'
      //      context.fillText(isStored ? idx.toString() : `[${idx}]`, xy.x + gridSize / 2, xy.y + gridSize / 2)
    }

    this.store.mapMasks.value.forEach(paintMapMask.bind(this, true, mm => {
      return {
        x: movingUuid === mm.uuid ? this.moveInfo.value.mc.x - this.moveInfo.value.mcStart.x % gridSize : mm.grid_x *
                                                                                                          gridSize,
        y: movingUuid === mm.uuid ? this.moveInfo.value.mc.y - this.moveInfo.value.mcStart.y % gridSize : mm.grid_y *
                                                                                                          gridSize,
      }
    }))
    this.holdWriteMapMasks.forEach(paintMapMask.bind(this, false, mm => {
      return {
        x: mm.grid_x * gridSize,
        y: mm.grid_y * gridSize,
      }
    }))
  }
}