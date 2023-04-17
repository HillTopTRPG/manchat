import { Location, MoveInfo } from '~/components/panes/PlayBoard/GeneralBoard.vue'
import { MapMask, sendParams as maskParams } from '~/data/RoomCollections/MapMask'
import { merge, pick } from 'lodash'
import axios from 'axios'
import { StoreType as RoomCollectionStore } from '~/data/RoomCollections'

const getAlphaColor = (c: string) => c
  .replace(/^(#.{6})$/, '$1FF')
  .replace(/.{2}$/, s => Math.max(parseInt(s, 16) * 0.6, 20).toString(16))

const matchLocation = (location: Location, mm: MapMask) => mm.grid_x === location.x && mm.grid_y === location.y

const maskLocParams = ['grid_x', 'grid_y', 'play_board_uuid'] as const
type MaskLoc = Pick<MapMask, typeof maskLocParams[number]>
type MaskParams = Pick<MapMask, typeof maskParams[number]>
const isEqlMaskLoc = (p1: MaskLoc, p2: MaskLoc) => !maskLocParams.some(key => p1[key] !== p2[key])
const isEqlMask    = (p1: MaskParams, p2: MaskParams) => !maskParams.some(key => p1[key] !== p2[key])

export default class {
  private holdWriteMapMasks: MaskParams[] = []
  private createMapMasks: MaskParams[]    = []
  private holdDeleteMapMasks: MaskLoc[]   = []
  private deleteUuids: string[]           = []

  public onUpdateMapMasks(store: RoomCollectionStore) {
    this.holdWriteMapMasks
        .map((l, idx) => store.mapMasks.value.some(mm => isEqlMaskLoc(mm, l)) ? idx : null)
        .filter((idx): idx is number => idx !== null)
        .reverse()
        .forEach(idx => this.holdWriteMapMasks.splice(idx, 1))

    this.holdDeleteMapMasks
        .map((l, idx) => store.mapMasks.value.some(mm => isEqlMaskLoc(mm, l)) ? null : idx)
        .filter((idx): idx is number => idx !== null)
        .reverse()
        .forEach(idx => this.holdDeleteMapMasks.splice(idx, 1))
  }

  private async writeMapMask(payload: MaskParams, store: RoomCollectionStore) {
    for (const mm of store.mapMasks.value) {
      if (isEqlMaskLoc(payload, mm)) {
        // 完全一致が見つかったら何もしない
        if (isEqlMask(payload, mm)) {
          return
        }

        // 位置だけ一致したら上書き保存する
        mm.bg_color = payload.bg_color
        return store.updateMapMask(merge({
                                           axios,
                                           map_mask_uuid: mm.uuid,
                                         }, pick(mm, ...maskParams)))
      }
    }
    if (this.holdWriteMapMasks.some(isEqlMaskLoc.bind(null, payload))) {
      return
    }

    // 新規追加
    this.holdWriteMapMasks.push(payload)
    this.createMapMasks.push(payload)
  }

  private deleteMapMask(payload: MaskLoc, store: RoomCollectionStore) {
    const useIsEqlLoc = isEqlMaskLoc.bind(null, payload)
    if (this.holdDeleteMapMasks.some(useIsEqlLoc)) {
      return
    }

    const deleteList = store.mapMasks.value.filter(useIsEqlLoc)
    if (!deleteList.length) {
      return
    }

    this.holdDeleteMapMasks.push(payload)
    this.deleteUuids.push(...deleteList.map(mm => mm.uuid))
  }

  private executeMapMaskDrag(
    moveInfo: MoveInfo,
    play_board_uuid: string,
    color: string,
    store: RoomCollectionStore,
    targetSubMode: '' | 'moving',
  ) {
    if (moveInfo.subMode !== targetSubMode) {
      return
    }

    const mapMaskBase = {
      play_board_uuid: play_board_uuid,
      grid_x         : moveInfo.mGrid.x,
      grid_y         : moveInfo.mGrid.y,
      bg_color       : color,
    }
    switch (moveInfo.mode) {
      case 'add-in:add':
        this.writeMapMask(mapMaskBase, store).then()
        break
      case 'add-in:delete':
        this.deleteMapMask(pick(mapMaskBase, ...maskLocParams), store)
        break
      default:
    }
  }

  public onStartMove = this.executeMapMaskDrag

  public onMove = this.executeMapMaskDrag

  public onEndMove(moveInfo: MoveInfo, store: RoomCollectionStore) {
    if (moveInfo.mode === 'add-in:add') {
      if (this.createMapMasks.length) {
        store.addMapMasks({
                            axios,
                            list: this.createMapMasks,
                          }).then()
        this.createMapMasks.splice(0, this.createMapMasks.length)
      }
    }
    if (moveInfo.mode === 'add-in:delete') {
      if (this.deleteUuids.length) {
        store.deleteMapMask({
                              axios,
                              uuids: this.deleteUuids,
                            }).then()
        this.deleteUuids.splice(0, this.deleteUuids.length)
      }
    }
    if (moveInfo.mode === 'add-in:move') {
      const matchList = store.mapMasks.value.filter(mm => matchLocation(moveInfo.mGridStart, mm))
      if (matchList.length) {
        const mm  = matchList.slice(-1)[0]
        mm.grid_x = moveInfo.mGrid.x
        mm.grid_y = moveInfo.mGrid.y
        store.updateMapMask(merge({
                                    axios,
                                    map_mask_uuid: mm.uuid,
                                  }, pick(mm, ...maskParams))).then()
      }
    }
  }

  public paint(
    context: CanvasRenderingContext2D,
    gridSize: number,
    moveInfo: MoveInfo,
    play_board_uuid: string,
    store: RoomCollectionStore,
  ) {
    let movingUuid: string | null = null
    if (moveInfo.mode === 'add-in:move' && moveInfo.toolType === 'grid' && moveInfo.subMode === 'moving') {
      movingUuid = [...store.mapMasks.value]
                     .reverse()
                     .find(matchLocation.bind(null, moveInfo.mGridStart))?.uuid || null
    }

    const paintMapMask = (
      isStored: boolean,
      getXY: (mm: MaskParams & { uuid?: string }) => Location,
      mm: MaskParams & { uuid?: string },
    ) => {
      if (play_board_uuid !== mm.play_board_uuid || this.holdDeleteMapMasks.some(dmm => isEqlMaskLoc(dmm, mm))) {
        return
      }

      const p           = getXY(mm)
      context.fillStyle = movingUuid === mm.uuid ? getAlphaColor(mm.bg_color) : mm.bg_color
      context.fillRect(p.x, p.y, gridSize + 1, gridSize + 1)
    }

    store.mapMasks.value.forEach(paintMapMask.bind(this, true, mm => {
      return {
        x: movingUuid === mm.uuid ? moveInfo.mc.x - moveInfo.mcStart.x % gridSize : mm.grid_x * gridSize,
        y: movingUuid === mm.uuid ? moveInfo.mc.y - moveInfo.mcStart.y % gridSize : mm.grid_y * gridSize,
      }
    }))
    this.holdWriteMapMasks.forEach(paintMapMask.bind(this, false, mm => {
      return {
        x: mm.grid_x * gridSize,
        y: mm.grid_y * gridSize,
      }
    }))

    if (moveInfo.toolType === 'grid') {
      // 現在のマス
      context.strokeStyle = '#ff0000'
      context.lineWidth   = 3
      context.beginPath()
      context.rect(moveInfo.mGrid.x * gridSize, moveInfo.mGrid.y * gridSize, gridSize, gridSize)
      context.stroke()
      context.lineWidth = 1
    }
  }
}
