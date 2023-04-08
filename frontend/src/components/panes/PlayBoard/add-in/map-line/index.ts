import { MapLine, sendParams as lineParams } from '~/data/RoomCollections/MapLine'
import { Location, MoveInfo } from '~/components/panes/PlayBoard/GeneralBoard.vue'
import { merge } from 'lodash'
import axios from 'axios'
import { StoreType as RoomCollectionStore } from '~/data/RoomCollections'

const lineLocParams = ['x1', 'y1', 'x2', 'y2', 'play_board_uuid'] as const
type LineParams = Pick<MapLine, typeof lineParams[number]>
type LineLoc = Pick<MapLine, typeof lineLocParams[number]>
const isEqlLineLoc = (p1: LineLoc, p2: LineLoc) => !lineLocParams.some(key => p1[key] !== p2[key])
const isEqlLine    = (p1: LineParams, p2: LineParams) => !lineParams.some(key => p1[key] !== p2[key])

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

const drawMapLine = (context: CanvasRenderingContext2D, gridSize: number, isFocus: boolean, line: LineParams) => {
  context.strokeStyle = line.color
  context.lineWidth   = isFocus ? 5 : 2
  context.beginPath()
  context.moveTo(line.x1 * gridSize, line.y1 * gridSize)
  context.lineTo(line.x2 * gridSize, line.y2 * gridSize)
  context.stroke()
}

const getNearestMapLineUuid = (play_board_uuid: string,
                               moveInfo: MoveInfo,
                               gridSize: number,
                               store: RoomCollectionStore,
) => {
  if (!store.mapLines.value.length) {
    return null
  }
  const result = store.mapLines.value
                      .filter(ml => ml.play_board_uuid === play_board_uuid)
                      .map(mapLine => {
                        return {
                          distance: getLinePointDistance(moveInfo.mc, gridSize, mapLine),
                          mapLine,
                        }
                      })
                      .reduce((s1, s2) => s1.distance < s2.distance ? s1 : s2)

  return result.distance < 10 ? result.mapLine.uuid : null
}

function paintNearestMousePoint(context: CanvasRenderingContext2D, moveInfo: MoveInfo, gridSize: number) {
  const p = getNearPoint(moveInfo, gridSize)

  context.fillStyle = '#ff0000'
  context.beginPath()
  context.arc(p.x * gridSize, p.y * gridSize, 5, 0, 2 * Math.PI, false)
  context.fill()
}

export default class {
  private holdWriteMapLines: LineParams[]       = []
  private mouseNearMapLineUuid: string | null   = null
  private drawingMapLineInfo: LineParams | null = null

  public onUpdateMapLines(store: RoomCollectionStore) {
    this.holdWriteMapLines
        .map((l, idx) => store.mapLines.value.some(ml => isEqlLineLoc(ml, l)) ? idx : null)
        .filter((idx): idx is number => idx !== null)
        .reverse()
        .forEach(idx => this.holdWriteMapLines.splice(idx, 1))
  }

  public onStartMove(moveInfo: MoveInfo, play_board_uuid: string, color: string, gridSize: number) {
    switch (moveInfo.mode) {
      case 'add-in:add':
        const p = getNearPoint(moveInfo, gridSize)

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
  }

  public onMove(moveInfo: MoveInfo, play_board_uuid: string, store: RoomCollectionStore, gridSize: number) {
    if (this.drawingMapLineInfo) {
      const p = getNearPoint(moveInfo, gridSize)

      this.drawingMapLineInfo.x2 = p.x
      this.drawingMapLineInfo.y2 = p.y
    }
    if (moveInfo.mode === 'add-in:move') {
      this.mouseNearMapLineUuid = getNearestMapLineUuid(play_board_uuid, moveInfo, gridSize, store)
    }
  }

  public onEndMove(moveInfo: MoveInfo, store: RoomCollectionStore) {
    if (moveInfo.mode === 'add-in:add') {
      if (this.drawingMapLineInfo) {
        this.holdWriteMapLines.push(this.drawingMapLineInfo)
        store.addMapLine(merge({
                                 axios,
                               }, this.drawingMapLineInfo)).then()
        this.drawingMapLineInfo = null
      }
    }
  }

  public paint(context: CanvasRenderingContext2D,
               gridSize: number,
               moveInfo: MoveInfo,
               play_board_uuid: string,
               store: RoomCollectionStore,
  ) {
    const filterFunc = (ml: LineParams & { uuid?: string }) => ml.play_board_uuid ===
                                                               play_board_uuid &&
                                                               ml.uuid !==
                                                               this.mouseNearMapLineUuid

    const useDrawMapLine = drawMapLine.bind(null, context, gridSize, false)
    store.mapLines.value.filter(filterFunc).forEach(useDrawMapLine)
    this.holdWriteMapLines.filter(filterFunc).forEach(useDrawMapLine)

    if (this.mouseNearMapLineUuid) {
      const focusLine = store.mapLines.value.find(ml => ml.uuid === this.mouseNearMapLineUuid)
      if (focusLine) {
        drawMapLine(context, gridSize, true, focusLine)
      }
    }

    if (this.drawingMapLineInfo) {
      drawMapLine(context, gridSize, false, this.drawingMapLineInfo)
    }
    if (moveInfo.toolType !== 'grid' && moveInfo.mode === 'add-in:add') {
      paintNearestMousePoint(context, moveInfo, gridSize)
    }
  }
}
