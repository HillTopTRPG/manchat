import { StoreType as RoomCollectionStore } from '~/data/RoomCollections'
import { MoveInfo } from '~/components/panes/PlayBoard/GeneralBoard.vue'
import MapMaskAddIn from '~/components/panes/PlayBoard/add-in/ map-mask'
import MapLineAddIn from '~/components/panes/PlayBoard/add-in/map-line'

export class AddIn {
  private readonly mapLineAddIn: MapLineAddIn
  private readonly mapMaskAddIn: MapMaskAddIn

  public constructor() {
    this.mapMaskAddIn = new MapMaskAddIn()
    this.mapLineAddIn = new MapLineAddIn()
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
               play_board_uuid: string,
               store: RoomCollectionStore,
  ) {
    context.font = '20px serif'
    this.mapMaskAddIn.paint(context, gridSize, moveInfo, play_board_uuid, store)
    this.mapLineAddIn.paint(context, gridSize, moveInfo, play_board_uuid, store)
  }
}