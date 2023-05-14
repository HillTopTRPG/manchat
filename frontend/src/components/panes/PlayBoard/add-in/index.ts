import { StoreType as RoomCollectionStore } from '~/data/RoomCollections'
import { MoveInfo } from '~/components/panes/PlayBoard/GeneralBoard.vue'
import MapMaskAddIn from '~/components/panes/PlayBoard/add-in/map-mask'
import MapLineAddIn from '~/components/panes/PlayBoard/add-in/map-line'
import { changeColor, fillRectImageData } from '~/components/panes/PlayBoard/add-in/coordinate'
import BucketFillAddIn from '~/components/panes/PlayBoard/add-in/bucket-fill'

function drawHexs(context: CanvasRenderingContext2D,
                  boardType: string,
                  cols: number,
                  rows: number,
                  size: number,
                  images: ImageBitmap[],
) {
  const mapSinCos = boardType === 'hex-vertical' ? [Math.cos, Math.sin] : [Math.sin, Math.cos]
  const mapRowCol = boardType === 'hex-vertical' ? (hexSize: number, sqrt3: number, row: number, col: number) => {
    const yBase  = row + col % 2 / 2 + 0.5
    const col151 = col * 1.5 + 1
    return [hexSize * col151, hexSize * yBase * sqrt3]
  } : (hexSize: number, sqrt3: number, row: number, col: number) => {
    const xBase  = col + row % 2 / 2 + 0.5
    const row151 = row * 1.5 + 1
    return [hexSize * xBase * sqrt3, hexSize * row151]
  }

  const sqrt3   = Math.sqrt(3)
  const hexSize = size / sqrt3

  const hexAry = Array(6)
    .fill(0)
    .map((_, idx) => idx * 2 * Math.PI / 6)
    .map((i) => [mapSinCos[0](i), mapSinCos[1](i)])
    .map(i => [i[0] * hexSize, i[1] * hexSize])

  const colsAry = Array(cols).fill(0)
  Array(rows).fill(0).map((_, row) => colsAry.map((_, col) => {
    if (boardType === 'hex-vertical' && col % 2 === 1 && row === rows - 1) {
      return
    }
    if (boardType === 'hex-horizontal' && row % 2 === 1 && col === cols - 1) {
      return
    }
    const p = mapRowCol(hexSize, sqrt3, row, col)
    context.beginPath()

    const uHexAry = hexAry.map(i => p.concat().map((n, idx) => n + i[idx] + 1))
    uHexAry.forEach((up, idx) => idx === 0 ? context.moveTo(up[0], up[1]) : context.lineTo(up[0], up[1]))

    context.closePath()
    context.fillStyle = '#ffff0066'
    context.lineWidth = 1
    context.fill()
    if (images.length >= 2) {
      const image = Math.floor(Math.random() * 10) < 2 ? images[1] : images[0]
      context.drawImage(image, 0, 0, 58, 50, p[0] - size / sqrt3 + 1, p[1] - size / 2 + 1, size * 2 / sqrt3, size)
    }
    context.stroke()
    //    context.fillStyle = '#000000'
    //    context.fillRect(p[0] - size / sqrt3 + 1, p[1] - size / 2 + 1, 2, 2)
    //    context.fillText(`${row}-${col}`, p[0] + 1, p[1] + 1)
  }))
}

export function mergeColorImageData(img1: Uint8ClampedArray | number[],
                                    img1Pos: number,
                                    img2: Uint8ClampedArray | number[],
                                    img2Pos: number,
                                    merged: Uint8ClampedArray | number[],
                                    mPos: number,
) {
  let r1   = img1[img1Pos]
  let g1   = img1[img1Pos + 1]
  let b1   = img1[img1Pos + 2]
  const a1 = img1[img1Pos + 3]

  const sum1 = r1 + g1 + b1 + a1
  if (sum1 === 0) {
    r1 = g1 = b1 = 255
  }

  const rd = img2[img2Pos] - r1
  const gd = img2[img2Pos + 1] - g1
  const bd = img2[img2Pos + 2] - b1

  const a2    = img2[img2Pos + 3]
  const ratio = a2 / 255

  merged[mPos]     = r1 + rd * ratio
  merged[mPos + 1] = g1 + gd * ratio
  merged[mPos + 2] = b1 + bd * ratio
  merged[mPos + 3] = Math.max(a1, a2)
}

function mergeImageData(img1: ImageData, img2: ImageData, merged: ImageData) {
  for (let i = 0; i < merged.data.length; i += 4) {
    mergeColorImageData(img1.data, i, img2.data, i, merged.data, i)
  }
}

export class AddIn {
  private readonly mapLineAddIn: MapLineAddIn
  private readonly mapMaskAddIn: MapMaskAddIn
  private readonly bucketFillAddIn: BucketFillAddIn
  private images: ImageBitmap[] = []

  public constructor() {
    this.mapMaskAddIn    = new MapMaskAddIn()
    this.mapLineAddIn    = new MapLineAddIn()
    this.bucketFillAddIn = new BucketFillAddIn()

    function getImageUrl(url: string) {
      return `${location.protocol}//${location.hostname}:9000/manchat/${url}`
    }

    async function loadImage(src: string): Promise<ImageBitmap> {
      return new Promise<ImageBitmap>((resolve, reject) => {
        const img: HTMLImageElement = new Image()

        img.onload  = () => createImageBitmap(img).then(ib => resolve(ib)).catch(reject)
        img.onerror = reject
        img.src     = src
      })
    }

    loadImage(getImageUrl('field_h.png')).then(img => this.images.push(img))
    loadImage(getImageUrl('forest_h.png')).then(img => this.images.push(img))
  }

  public onUpdateCollection(store: RoomCollectionStore, kind: string) {
    switch (kind) {
      case 'map-mask':
        this.mapMaskAddIn.onUpdateMapMasks(store)
        break
      case 'map-list':
        this.mapLineAddIn.onUpdateMapLines(store)
        break
      default:
    }
  }

  public onStartMove(play_board_uuid: string,
                     moveInfo: MoveInfo,
                     color: string,
                     gridSize: number,
                     store: RoomCollectionStore,
  ) {
    switch (moveInfo.toolType) {
      case 'grid':
        this.mapMaskAddIn.onStartMove(moveInfo, play_board_uuid, color, store, '')
        break
      case 'line':
        this.mapLineAddIn.onStartMove(moveInfo, play_board_uuid, color, gridSize)
        break
      default:
    }
  }

  public onMove(play_board_uuid: string,
                moveInfo: MoveInfo,
                color: string,
                gridSize: number,
                store: RoomCollectionStore,
  ) {
    switch (moveInfo.toolType) {
      case 'grid':
        this.mapMaskAddIn.onMove(moveInfo, play_board_uuid, color, store, 'moving')
        break
      case 'line':
        this.mapLineAddIn.onMove(moveInfo, play_board_uuid, store, gridSize)
        break
      default:
    }
  }

  public onEndMove(moveInfo: MoveInfo, store: RoomCollectionStore) {
    switch (moveInfo.toolType) {
      case 'grid':
        this.mapMaskAddIn.onEndMove(moveInfo, store)
        break
      case 'line':
        this.mapLineAddIn.onEndMove(moveInfo, store)
        break
      default:
    }
  }

  public paint(context: CanvasRenderingContext2D,
               gridSize: number,
               moveInfo: MoveInfo,
               playBoardUuid: string,
               store: RoomCollectionStore,
               color: string,
  ) {
    const columns   = store.playBoards.value.find(pb => pb.uuid === playBoardUuid)?.width || 0
    const rows      = store.playBoards.value.find(pb => pb.uuid === playBoardUuid)?.height || 0
    const boardType = store.playBoards.value.find(pb => pb.uuid === playBoardUuid)?.board_type || 'normal'

    const sqrt3 = Math.sqrt(3)
    const col31 = columns * 3 + 1
    const row31 = rows * 3 + 1

    const canvasWidth  = boardType === 'hex-vertical' ? col31 * gridSize / 2 / sqrt3 + 2 : columns * gridSize + 1
    const canvasHeight = boardType === 'hex-horizontal' ? row31 * gridSize / 2 / sqrt3 + 2 : rows * gridSize + 1

    // 描画処理
    const createPayload = (imageData: ImageData) => (
      {
        imageData,
        gridSize,
        moveInfo,
        playBoardUuid,
        store,
        canvasWidth,
        canvasHeight,
        columns,
        rows,
        color: changeColor(color),
      }
    )

    context.clearRect(0, 0, canvasWidth, canvasHeight)

    if (boardType === 'normal') {
      const imgData1      = context.createImageData(canvasWidth, canvasHeight)
      const imgData2      = context.createImageData(imgData1)
      const mergedImgData = context.createImageData(imgData1)

      // 罫線
      const cStr       = store.playBoards.value.find(pb => pb.uuid === playBoardUuid)?.border_color || '#000000'
      const drawBorder = fillRectImageData.bind(null, imgData1, canvasWidth, changeColor(cStr))
      Array(columns + 1).fill(0).forEach((_, column) => drawBorder(column * gridSize, 0, 1, canvasHeight))
      Array(rows + 1).fill(0).forEach((_, row) => drawBorder(0, row * gridSize, canvasWidth, 1))

      this.mapMaskAddIn.paint(createPayload(imgData1))
      this.mapLineAddIn.paint(createPayload(imgData2))
      this.bucketFillAddIn.paint(createPayload(imgData2))

      mergeImageData(imgData1, imgData2, mergedImgData)

      context.putImageData(mergedImgData, 0, 0)
    } else {
      if (boardType.startsWith('hex-')) {
        drawHexs(context, boardType, columns, rows, gridSize, this.images)
      }
    }
  }
}