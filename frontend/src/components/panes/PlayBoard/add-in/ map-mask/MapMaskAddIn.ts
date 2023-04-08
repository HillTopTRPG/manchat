import { InjectionKeySymbol as roomCollectionsKey, StoreType as RoomCollectionStore } from '~/data/RoomCollections'
import { inject, watch } from 'vue'
import { MapMask, sendParams as maskParams } from '~/data/RoomCollections/MapMask'
import axios from 'axios'
import { merge, pick } from 'lodash'
import { Location, MoveInfo } from '~/components/panes/PlayBoard/GeneralBoard.vue'
import { MapLine, sendParams as lineParams } from '~/data/RoomCollections/MapLine'

const matchLocation = (location: Location, mm: MapMask) => mm.grid_x === location.x && mm.grid_y === location.y

const getAlphaColor = (c: string) => c
  .replace(/^(#.{6})$/, '$1FF')
  .replace(/.{2}$/, s => Math.max(parseInt(s, 16) * 0.6, 20).toString(16))

const maskLocParams = ['grid_x', 'grid_y', 'play_board_uuid'] as const
type MaskLoc = Pick<MapMask, typeof maskLocParams[number]>
type MaskParams = Pick<MapMask, typeof maskParams[number]>
const isEqlMaskLoc = (p1: MaskLoc, p2: MaskLoc) => !maskLocParams.some(key => p1[key] !== p2[key])
const isEqlMask    = (p1: MaskParams, p2: MaskParams) => !maskParams.some(key => p1[key] !== p2[key])

const lineLocParams = ['x1', 'y1', 'x2', 'y2', 'play_board_uuid'] as const
type LineParams = Pick<MapLine, typeof lineParams[number]>
type LineLoc = Pick<MapLine, typeof lineLocParams[number]>
const isEqlLineLoc = (p1: LineLoc, p2: LineLoc) => !lineLocParams.some(key => p1[key] !== p2[key])
const isEqlLine    = (p1: LineParams, p2: LineParams) => !lineParams.some(key => p1[key] !== p2[key])

const drawMapLine = (context: CanvasRenderingContext2D, gridSize: number, isFocus: boolean, line: LineParams) => {
  context.strokeStyle = line.color
  context.lineWidth   = isFocus ? 5 : 2
  context.beginPath()
  context.moveTo(line.x1 * gridSize, line.y1 * gridSize)
  context.lineTo(line.x2 * gridSize, line.y2 * gridSize)
  context.stroke()
}

const getCellPoints = (p1: Location, gridSize: number) => {
  const p2 = new Location(p1.x + gridSize / 2, p1.y)
  const p3 = new Location(p1.x + gridSize, p1.y)
  const p4 = new Location(p1.x, p1.y + gridSize / 2)
  const p5 = new Location(p1.x + gridSize / 2, p1.y + gridSize / 2)
  const p6 = new Location(p1.x + gridSize, p1.y + gridSize / 2)
  const p7 = new Location(p1.x, p1.y + gridSize)
  const p8 = new Location(p1.x + gridSize / 2, p1.y + gridSize)
  const p9 = new Location(p1.x + gridSize, p1.y + gridSize)
  return [p1, p2, p3, p4, p5, p6, p7, p8, p9]
}

const getNearPoint = (moveInfo: MoveInfo, gridSize: number): Location => {
  const p1          = new Location(moveInfo.mGrid.x * gridSize, moveInfo.mGrid.y * gridSize)
  const ps          = getCellPoints(p1, gridSize)
  const getDistance = (p: Location) => Math.hypot(moveInfo.mc.x - p.x, moveInfo.mc.y - p.y)
  const p           = ps.reduce((ps1, ps2) => getDistance(ps1) < getDistance(ps2) ? ps1 : ps2)
  return new Location(Math.round(p.x / gridSize * 2) / 2, Math.round(p.y / gridSize * 2) / 2)
}

const getLinePointDistance = (p: Location, gridSize: number, line: LineLoc) => {
  const x1 = line.x1 * gridSize
  const y1 = line.y1 * gridSize
  const x2 = line.x2 * gridSize
  const y2 = line.y2 * gridSize

  const a  = x2 - x1
  const b  = y2 - y1
  const r2 = Math.pow(a, 2) + Math.pow(b, 2)
  const xd = x1 - p.x
  const yd = y1 - p.y
  const tt = -a * xd - b * yd
  if (tt < 0) {
    return Math.hypot(x1 - p.x, y1 - p.y)
  }
  if (tt > r2) {
    return Math.hypot(x2 - p.x, y2 - p.y)
  }
  return Math.sqrt(Math.pow(a * yd - b * xd, 2) / r2)
}

export class MapMaskAddIn {
  private store: RoomCollectionStore
  private holdWriteMapMasks: MaskParams[]       = []
  private holdDeleteMapMasks: MaskLoc[]         = []
  private drawingMapLineInfo: LineParams | null = null
  private holdWriteMapLines: LineParams[]       = []
  private mouseNearMapLineUuid: string | null   = null

  public constructor(//    private moveInfo: Ref<MoveInfo>,
    //    private play_board_uuid: Ref<string>,
    //    private color: Ref<string>,
  ) {
    this.store = inject(roomCollectionsKey) as RoomCollectionStore
    watch(this.store.mapMasks, this.onUpdateMapMasks.bind(this), { deep: true })
    watch(this.store.mapLines, this.onUpdateMapLines.bind(this), { deep: true })
  }

  public onChangeBoard() {
    this.holdWriteMapMasks.splice(0, this.holdWriteMapMasks.length)
    this.holdDeleteMapMasks.splice(0, this.holdDeleteMapMasks.length)
  }

  private async writeMapMask(payload: MaskParams) {
    const useIsEqualLocation = isEqlMaskLoc.bind(null, payload)
    const useIsEqual         = isEqlMask.bind(null, payload)
    if (this.holdWriteMapMasks.some(useIsEqualLocation) || this.store.mapMasks.value.some(useIsEqual)) {
      return
    }

    const updateMapMask = this.store.mapMasks.value.find(useIsEqualLocation)
    if (updateMapMask) {
      updateMapMask.bg_color = payload.bg_color
      return this.store.updateMapMask(merge({
                                              axios,
                                              map_mask_uuid: updateMapMask.uuid,
                                            }, pick(updateMapMask, ...maskParams)))
    } else {
      this.holdWriteMapMasks.push(payload)
      return this.store.addMapMask(merge({
                                           axios,
                                         }, payload))
    }
  }

  private async deleteMapMask(payload: MaskLoc) {
    const useIsEqualLocation = isEqlMaskLoc.bind(null, payload)
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

  private executeMapMaskDrag(subMode: string,
                             play_board_uuid: string,
                             moveInfo: MoveInfo,
                             color: string,
                             gridSize: number,
  ) {
    if (moveInfo.subMode !== subMode) {
      return
    }
    switch (moveInfo.toolType) {
      case 'grid':
        const mapMaskBase = {
          play_board_uuid: play_board_uuid,
          grid_x         : moveInfo.mGrid.x,
          grid_y         : moveInfo.mGrid.y,
          bg_color       : color,
        }
        switch (moveInfo.mode) {
          case 'add-in:add':
            this.writeMapMask(mapMaskBase).then()
            break
          case 'add-in:delete':
            this.deleteMapMask(pick(mapMaskBase, ...maskLocParams)).then()
            break
          default:
        }
        break
      case 'line':
        break
      default:
    }
  }

  public onStartMove(play_board_uuid: string, moveInfo: MoveInfo, color: string, gridSize: number) {
    switch (moveInfo.toolType) {
      case 'grid':
        this.executeMapMaskDrag('', play_board_uuid, moveInfo, color, gridSize)
        break
      case 'line':
        switch (moveInfo.mode) {
          case 'add-in:add':
            const p                 = getNearPoint(moveInfo, gridSize)
            this.drawingMapLineInfo = {
              play_board_uuid,
              x1: p.x,
              y1: p.y,
              x2: p.x,
              y2: p.y,
              color,
            }
            break
          case 'add-in:delete':
            // TODO
            break
          default:
        }
        break
      default:
    }
  }

  public onMove(play_board_uuid: string, moveInfo: MoveInfo, color: string, gridSize: number) {
    switch (moveInfo.toolType) {
      case 'grid':
        this.executeMapMaskDrag('moving', play_board_uuid, moveInfo, color, gridSize)
        break
      case 'line':
        if (this.drawingMapLineInfo) {
          const p                    = getNearPoint(moveInfo, gridSize)
          this.drawingMapLineInfo.x2 = p.x
          this.drawingMapLineInfo.y2 = p.y
        }
        if (moveInfo.mode === 'add-in:move' && this.store.mapLines.value.length) {
          const result = this.store.mapLines.value
                             .filter(ml => ml.play_board_uuid === play_board_uuid)
                             .map(mapLine => {
                               return {
                                 distance: getLinePointDistance(moveInfo.mc, gridSize, mapLine),
                                 mapLine,
                               }
                             })
                             .reduce((s1, s2) => s1.distance < s2.distance ? s1 : s2)

          this.mouseNearMapLineUuid = result.distance < 10 ? result.mapLine.uuid : null
        }
        break
      default:
    }
  }

  public onEndMove(isMouseUp: boolean, moveInfo: MoveInfo, gridSize: number) {
    if (!isMouseUp) {
      return
    }
    switch (moveInfo.toolType) {
      case 'grid':
        if (moveInfo.mode === 'add-in:move') {
          const matchList = this.store.mapMasks.value.filter(mm => matchLocation(moveInfo.mGridStart, mm))
          if (matchList.length) {
            const mm  = matchList.slice(-1)[0]
            mm.grid_x = moveInfo.mGrid.x
            mm.grid_y = moveInfo.mGrid.y
            this.store.updateMapMask(merge({
                                             axios,
                                             map_mask_uuid: mm.uuid,
                                           }, pick(mm, ...maskParams))).then()
          }
        }
        break
      case 'line':
        if (moveInfo.mode === 'add-in:add') {
          if (this.drawingMapLineInfo) {
            this.holdWriteMapLines.push(this.drawingMapLineInfo)
            this.store.addMapLine(merge({
                                          axios,
                                        }, this.drawingMapLineInfo)).then()
            console.log(this.drawingMapLineInfo.x1,
                        this.drawingMapLineInfo.y1,
                        this.drawingMapLineInfo.x2,
                        this.drawingMapLineInfo.y2,
            )
            this.drawingMapLineInfo = null
          }
        }
        break
      default:
    }
  }

  private onUpdateMapMasks() {
    this.holdWriteMapMasks
        .map((l, idx) => this.store.mapMasks.value.some(mm => isEqlMaskLoc(mm, l)) ? idx : null)
        .filter((idx): idx is number => idx !== null)
        .reverse()
        .forEach(idx => this.holdWriteMapMasks.splice(idx, 1))

    this.holdDeleteMapMasks
        .map((l, idx) => this.store.mapMasks.value.some(mm => isEqlMaskLoc(mm, l)) ? null : idx)
        .filter((idx): idx is number => idx !== null)
        .reverse()
        .forEach(idx => this.holdDeleteMapMasks.splice(idx, 1))
  }

  private onUpdateMapLines() {
    this.holdWriteMapLines
        .map((l, idx) => this.store.mapLines.value.some(ml => isEqlLineLoc(ml, l)) ? idx : null)
        .filter((idx): idx is number => idx !== null)
        .reverse()
        .forEach(idx => this.holdWriteMapLines.splice(idx, 1))
  }

  private paintMapMasks(context: CanvasRenderingContext2D,
                        gridSize: number,
                        moveInfo: MoveInfo,
                        play_board_uuid: string,
  ) {
    let movingUuid: string | null = null
    if (moveInfo.mode === 'add-in:move' && moveInfo.toolType === 'grid' && moveInfo.subMode === 'moving') {
      movingUuid = [...this.store.mapMasks.value]
                     .reverse()
                     .find(matchLocation.bind(null, moveInfo.mGridStart))?.uuid || null
    }

    const paintMapMask = (isStored: boolean,
                          getXY: (mm: MaskParams & { uuid?: string }) => Location,
                          mm: MaskParams & { uuid?: string },
    ) => {
      const xy = getXY(mm)

      if (play_board_uuid !== mm.play_board_uuid) {
        return
      }

      if (this.holdDeleteMapMasks.some(dmm => isEqlMaskLoc(dmm, mm))) {
        return
      }

      context.fillStyle = movingUuid === mm.uuid ? getAlphaColor(mm.bg_color) : mm.bg_color
      context.fillRect(xy.x, xy.y, gridSize, gridSize)
    }

    this.store.mapMasks.value.forEach(paintMapMask.bind(this, true, mm => {
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
  }

  private paintMapLines(context: CanvasRenderingContext2D,
                        gridSize: number,
                        moveInfo: MoveInfo,
                        play_board_uuid: string,
  ) {
    const filterFunc     = (ml: LineParams & { uuid?: string }) => ml.play_board_uuid ===
                                                                   play_board_uuid &&
                                                                   ml.uuid !==
                                                                   this.mouseNearMapLineUuid
    const useDrawMapLine = drawMapLine.bind(this, context, gridSize, false)
    this.store.mapLines.value.filter(filterFunc).forEach(useDrawMapLine)
    this.holdWriteMapLines.filter(filterFunc).forEach(useDrawMapLine)
    const focusLine = this.store.mapLines.value.find(ml => ml.uuid === this.mouseNearMapLineUuid)
    if (focusLine) {
      drawMapLine(context, gridSize, true, focusLine)
    }
  }

  public paint(context: CanvasRenderingContext2D, gridSize: number, moveInfo: MoveInfo, play_board_uuid: string) {
    context.font = '20px serif'
    this.paintMapMasks(context, gridSize, moveInfo, play_board_uuid)
    this.paintMapLines(context, gridSize, moveInfo, play_board_uuid)
    if (this.drawingMapLineInfo) {
      drawMapLine(context, gridSize, false, this.drawingMapLineInfo)
    }

    // 現在のマス
    if (moveInfo.toolType === 'grid') {
      context.strokeStyle = '#ff0000'
      context.lineWidth   = 3
      context.beginPath()
      context.rect(moveInfo.mGrid.x * gridSize, moveInfo.mGrid.y * gridSize, gridSize, gridSize)
      context.stroke()
      context.lineWidth = 1
    } else {
      if (moveInfo.mode === 'add-in:add') {
        const p = getNearPoint(moveInfo, gridSize)

        context.fillStyle = '#ff0000'
        context.beginPath()
        context.arc(p.x * gridSize, p.y * gridSize, 5, 0, 2 * Math.PI, false)
        context.fill()
      }
    }
  }
}