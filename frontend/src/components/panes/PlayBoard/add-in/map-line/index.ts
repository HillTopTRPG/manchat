import { MapLine, sendParams as lineParams } from '~/data/RoomCollections/MapLine'
import { Location, MoveInfo } from '~/components/panes/PlayBoard/GeneralBoard.vue'
import { merge } from 'lodash'
import axios from 'axios'
import { StoreType as RoomCollectionStore } from '~/data/RoomCollections'
import {
  drawMapLine, fillColor, getNearestMapLineUuid, getNearPoint, paintNearestMousePoint,
} from '~/components/panes/PlayBoard/add-in/map-line/coordinate'

const lineLocParams = ['x1', 'y1', 'x2', 'y2', 'play_board_uuid'] as const
export type LineParams = Pick<MapLine, typeof lineParams[number]>
export type LineLoc = Pick<MapLine, typeof lineLocParams[number]>
const isEqlLineLoc = (p1: LineLoc, p2: LineLoc) => !lineLocParams.some(key => p1[key] !== p2[key])
const isEqlLine    = (p1: LineParams, p2: LineParams) => !lineParams.some(key => p1[key] !== p2[key])

export default class {
  private holdWriteMapLines: LineParams[]       = []
  private mouseNearMapLineUuid: string | null   = null
  private drawingMapLineInfo: LineParams | null = null
  private fillPoint: Location | null            = null
  private fillColor: string                     = '#ff0000'

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

  public addFillPoint(moveInfo: MoveInfo, store: RoomCollectionStore) {
    if (this.fillPoint) {
      this.fillPoint = null
    } else {
      this.fillPoint = new Location(Math.floor(moveInfo.mc.x), Math.floor(moveInfo.mc.y))
      this.fillColor = '#00ff00ff'
    }
  }

  public onEndMove(moveInfo: MoveInfo, store: RoomCollectionStore) {
    if (moveInfo.mode === 'add-in:add') {
      if (this.drawingMapLineInfo) {
        if (this.drawingMapLineInfo.x1 !==
            this.drawingMapLineInfo.x2 ||
            this.drawingMapLineInfo.y1 !==
            this.drawingMapLineInfo.y2) {
          this.holdWriteMapLines.push(this.drawingMapLineInfo)
          store.addMapLine(merge({
                                   axios,
                                 }, this.drawingMapLineInfo)).then()
        }
        this.drawingMapLineInfo = null
      }
    }
  }

  public paint(
    context: CanvasRenderingContext2D,
    gridSize: number,
    moveInfo: MoveInfo,
    play_board_uuid: string,
    store: RoomCollectionStore,
    canvasWidth: number,
    canvasHeight: number,
  ): ImageData {
    const filterFunc = (ml: LineParams & { uuid?: string }) => ml.play_board_uuid ===
                                                               play_board_uuid &&
                                                               ml.uuid !==
                                                               this.mouseNearMapLineUuid

    const useDrawMapLine = drawMapLine.bind(null, context, gridSize, false)

    // 全部描く
    store.mapLines.value.filter(filterFunc).forEach(useDrawMapLine)
    this.holdWriteMapLines.filter(filterFunc).forEach(useDrawMapLine)

    // マウスカーソルの近くの線を描く
    if (this.mouseNearMapLineUuid) {
      const focusLine = store.mapLines.value.find(ml => ml.uuid === this.mouseNearMapLineUuid)
      if (focusLine) {
        drawMapLine(context, gridSize, true, focusLine)
      }
    }

    // 描いてる途中の線を描く
    if (this.drawingMapLineInfo) {
      drawMapLine(context, gridSize, false, this.drawingMapLineInfo)
    }

    // マウスカーソルの点を描く
    if (moveInfo.toolType !== 'grid' && moveInfo.mode === 'add-in:add') {
      paintNearestMousePoint(context, moveInfo, gridSize)
    }

    const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight)

    // 塗りつぶし表現を描く
    if (this.fillPoint) {
      fillColor(this.fillPoint.x, this.fillPoint.y, imageData, [255, 255, 0, 200], canvasWidth, canvasHeight)
    }

    return imageData
  }
}
