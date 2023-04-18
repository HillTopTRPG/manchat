import { mergeColorImageData } from '~/components/panes/PlayBoard/add-in/index'

const loop4 = Array(4).fill(0).map((_, idx) => idx)

export function toImageDataPixelPos(x: number, y: number, canvasWidth: number) {
  const a = canvasWidth * y + x
  return a * 4
}

export function fillRectImageData(imgData: ImageData,
                                  canvasWidth: number,
                                  color: number[],
                                  x: number,
                                  y: number,
                                  width: number,
                                  height: number,
) {
  const minX = Math.min(x, x + width)
  const minY = Math.min(y, y + height)
  const maxX = Math.max(x, x + width)
  const maxY = Math.max(y, y + height)
  for (let ux = minX; ux < maxX; ux++) {
    for (let uy = minY; uy < maxY; uy++) {
      const pos = toImageDataPixelPos(ux, uy, canvasWidth)
      if (pos < imgData.data.length) {
        mergeColorImageData(imgData.data, pos, color, 0, imgData.data, pos)
      }
    }
  }
}

export function changeColor(colorStr: string): number[] {
  const color: number[] = colorStr.slice(1).match(/.{2}/g)!.map(s => parseInt(s, 16))
  if (color.length === 3) {
    color.push(255)
  }
  return color
}

export function drawLineImageData(imgData: ImageData,
                                  x0: number,
                                  y0: number,
                                  x1: number,
                                  y1: number,
                                  width: number,
                                  colorStr: string,
                                  canvasWidth: number,
) {
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err  = dx - dy

  const drawLine  = fillRectImageData.bind(null, imgData, canvasWidth, changeColor(colorStr))
  const flWidth12 = Math.floor(width / 2 - 0.5)

  if (x0 === x1) {
    drawLine(x0 - flWidth12, y0, width, y1 - y0)
    return
  }

  const deg      = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI
  const quadrant = Math.floor(Math.abs(deg) / 45)
  const qFlg     = quadrant !== 1 && quadrant !== 2 // 縦に伸ばす

  while (sx < 0 && x0 > x1 || sx > 0 && x0 < x1 || sy < 0 && y0 > y1 || sy < 0 && y0 < y1) {
    if (qFlg) {
      drawLine(x0, y0 - flWidth12, 1, width)
    } else {
      drawLine(x0 - flWidth12, y0, width, 1)
    }
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
  const startPixelPos = toImageDataPixelPos(startX, startY, canvasWidth)

  const baseColor = [...imgData.data.slice(startPixelPos, startPixelPos + 4)]

  //  Array(200).fill(0).forEach((_, idx) => {
  //    const d       = imgData.data
  //    const baseIdx = idx * 4 + cWidth * idx * 4
  //    const s       = `(${d[baseIdx]}, ${d[baseIdx + 1]}, ${d[baseIdx + 2]}, ${d[baseIdx + 3]})`
  //    console.log(s)
  //  })

  const isMatchColor = (x: number, y: number, color: number[]) => {
    const pp = toImageDataPixelPos(x, y, canvasWidth)
    return loop4.every(idx => imgData.data[pp + idx] === color[idx])
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
      const pp = toImageDataPixelPos(x, y, canvasWidth)
      loop4.forEach(idx => imgData.data[pp + idx] = penColor[idx])
    }
    y + 1 < canvasHeight && scanLine(leftX, rightX, y + 1)
    y - 1 >= 0 && scanLine(leftX, rightX, y - 1)
  }
}