import { MoveInfo } from '~/components/panes/PlayBoard/GeneralBoard.vue'
import { fillColor } from '~/components/panes/PlayBoard/add-in/coordinate'

export default class {
  public paint({
                 imageData,
                 moveInfo,
                 canvasWidth,
                 canvasHeight,
                 color,
               }: {
    imageData: ImageData, moveInfo: MoveInfo, canvasWidth: number, canvasHeight: number, color: number[],
  }): void {
    // 塗りつぶし表現を描く
    if (moveInfo.toolType === 'shape' && moveInfo.mode === 'add-in:add') {
      fillColor(Math.floor(moveInfo.mc.x), Math.floor(moveInfo.mc.y), imageData, color, canvasWidth, canvasHeight)
    }
  }
}
