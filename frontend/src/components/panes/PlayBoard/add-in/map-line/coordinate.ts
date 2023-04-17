import { Location, MoveInfo } from '~/components/panes/PlayBoard/GeneralBoard.vue'
import { StoreType as RoomCollectionStore } from '~/data/RoomCollections'
import { LineLoc, LineParams } from '~/components/panes/PlayBoard/add-in/map-line/index'

function getCellPoints(p1: Location, gridSize: number) {
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

function getLinePointDistance(p: Location, gridSize: number, line: LineLoc) {
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

function drawLine(context: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, width: number) {
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err  = dx - dy

  const flWidth12 = Math.floor((
                                 width - 1
                               ) / 2)

  if (x0 === x1) {
    context.fillRect(x0 - flWidth12, y0, width, y1 - y0)
    return
  }

  const deg      = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI
  const quadrant = Math.floor(Math.abs(deg) / 45)
  const qFlg     = quadrant !== 1 && quadrant !== 2 // 縦に伸ばす

  while (sx < 0 && x0 > x1 || sx > 0 && x0 < x1 || sy < 0 && y0 > y1 || sy < 0 && y0 < y1) {
    console.log(x0, y0, x1, y1)
    context.fillRect(qFlg ? x0 : x0 - flWidth12, qFlg ? y0 - flWidth12 : y0, qFlg ? 1 : width, qFlg ? width : 1)
    const e2 = err * 2
    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }
}

export function getNearPoint(moveInfo: MoveInfo, gridSize: number): Location {
  const p1          = new Location(moveInfo.mGrid.x * gridSize, moveInfo.mGrid.y * gridSize)
  const ps          = getCellPoints(p1, gridSize)
  const getDistance = (p: Location) => Math.hypot(moveInfo.mc.x - p.x, moveInfo.mc.y - p.y)
  const p           = ps.reduce((ps1, ps2) => getDistance(ps1) < getDistance(ps2) ? ps1 : ps2)
  return new Location(Math.round(p.x / gridSize * 2) / 2, Math.round(p.y / gridSize * 2) / 2)
}

export function drawMapLine(context: CanvasRenderingContext2D, gridSize: number, isFocus: boolean, line: LineParams) {
  context.fillStyle = line.color
  drawLine(context,
           Math.round(line.x1 * gridSize),
           Math.round(line.y1 * gridSize),
           Math.round(line.x2 * gridSize),
           Math.round(line.y2 * gridSize),
           isFocus ? 5 : 3,
  )
}

export function getNearestMapLineUuid(play_board_uuid: string,
                                      moveInfo: MoveInfo,
                                      gridSize: number,
                                      store: RoomCollectionStore,
) {
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

export function paintNearestMousePoint(context: CanvasRenderingContext2D, moveInfo: MoveInfo, gridSize: number) {
  const p = getNearPoint(moveInfo, gridSize)

  context.fillStyle = '#ff0000'
  context.beginPath()
  context.arc(p.x * gridSize, p.y * gridSize, 5, 0, 2 * Math.PI, false)
  context.fill()
}

/**
 *
 * @param {number} startX
 * @param {number} startY
 * @param {ImageData} imgData
 * @param {number[]} penColor [r:0~255, g:0-255, b:0~255, a:0~255]
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 */
export function fillColor(startX: number,
                          startY: number,
                          imgData: ImageData,
                          penColor: number[],
                          canvasWidth: number,
                          canvasHeight: number,
) {
  const toImageDataPixelPos = (x: number, y: number) => (
                                                          canvasWidth * y + x
                                                        ) * 4

  const loop4 = Array(4).fill(0).map((_, idx) => idx)

  const startPixelPos = toImageDataPixelPos(startX, startY)

  const baseColor = [...imgData.data.slice(startPixelPos, startPixelPos + 4)]

  //  Array(200).fill(0).forEach((_, idx) => {
  //    const d       = imgData.data
  //    const baseIdx = idx * 4 + cWidth * idx * 4
  //    const s       = `(${d[baseIdx]}, ${d[baseIdx + 1]}, ${d[baseIdx + 2]}, ${d[baseIdx + 3]})`
  //    console.log(s)
  //  })

  const isMatchColor = (x: number, y: number, color: number[]) => {
    const pp = toImageDataPixelPos(x, y)
    return !loop4.some(idx => imgData.data[pp + idx] !== color[idx])
  }

  if (isMatchColor(startX, startY, penColor)) {
    return
  }

  const buffer: number[] = [startX, startY]

  const scanLine = (leftX: number, rightX: number, y: number) => {
    while (leftX <= rightX) {
      while (leftX <= rightX && !isMatchColor(leftX, y, baseColor)) {
        leftX++
      }
      if (rightX < leftX) {
        break
      }
      while (leftX <= rightX && isMatchColor(leftX, y, baseColor)) {
        leftX++
      }
      buffer.push(leftX - 1, y)
    }
  }

  while (buffer.length > 0) {
    const y    = buffer.pop()!
    let leftX  = buffer.pop()!
    let rightX = leftX
    if (isMatchColor(leftX, y, penColor)) {
      continue
    }

    while (0 < leftX && isMatchColor(leftX - 1, y, baseColor)) {
      leftX--
    }
    while (rightX < canvasWidth - 1 && isMatchColor(rightX + 1, y, baseColor)) {
      rightX++
    }

    for (let x = leftX; x <= rightX; x++) {
      const pp = toImageDataPixelPos(x, y)
      loop4.forEach(idx => imgData.data[pp + idx] = penColor[idx])
    }
    y + 1 < canvasHeight && scanLine(leftX, rightX, y + 1)
    y - 1 >= 0 && scanLine(leftX, rightX, y - 1)
  }
}