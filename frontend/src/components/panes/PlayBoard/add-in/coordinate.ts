const loop4 = Array(4).fill(0).map((_, idx) => idx)

export function toImageDataPixelPos(x: number, y: number, canvasWidth: number) {
  const a = canvasWidth * y + x
  return a * 4
}

export function fillRectImageData(imgData: ImageData,
                                  color: number[],
                                  canvasWidth: number,
                                  minX: number,
                                  minY: number,
                                  maxX: number,
                                  maxY: number,
) {
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const pos = toImageDataPixelPos(x, y, canvasWidth)
      if (pos < imgData.data.length) {
        loop4.forEach(idx => imgData.data[pos + idx] = color[idx])
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

  const color: number[] = changeColor(colorStr)

  const flWidth12 = Math.floor((
                                 width - 1
                               ) / 2)

  if (x0 === x1) {
    const minX = x0 - flWidth12
    fillRectImageData(imgData, color, canvasWidth, minX, Math.min(y0, y1), minX + width, Math.max(y0, y1))
    return
  }

  const deg      = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI
  const quadrant = Math.floor(Math.abs(deg) / 45)
  const qFlg     = quadrant !== 1 && quadrant !== 2 // 縦に伸ばす

  while (sx < 0 && x0 > x1 || sx > 0 && x0 < x1 || sy < 0 && y0 > y1 || sy < 0 && y0 < y1) {
    if (qFlg) {
      const minY = y0 - flWidth12
      fillRectImageData(imgData, color, canvasWidth, x0, minY, x0 + 1, minY + width)
    } else {
      const minX = x0 - flWidth12
      fillRectImageData(imgData, color, canvasWidth, minX, y0, minX + width, y0 + 1)
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
      const pp = toImageDataPixelPos(x, y, canvasWidth)
      loop4.forEach(idx => imgData.data[pp + idx] = penColor[idx])
    }
    y + 1 < canvasHeight && scanLine(leftX, rightX, y + 1)
    y - 1 >= 0 && scanLine(leftX, rightX, y - 1)
  }
}