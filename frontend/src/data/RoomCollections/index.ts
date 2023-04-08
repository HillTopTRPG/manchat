import { computed, inject, InjectionKey, reactive } from 'vue'
import { Chat, createChatFunctions } from '~/data/RoomCollections/Chat'
import { ChangeLog, createChangeLogFunctions } from '~/data/RoomCollections/ChangeLog'
import { createMapMaskFunctions, MapMask } from '~/data/RoomCollections/MapMask'
import { User } from '~/data/user'
import { createPlayBoardFunctions, PlayBoard } from '~/data/RoomCollections/PlayBoard'
import { createMapLineFunctions, MapLine } from '~/data/RoomCollections/MapLine'

const changeDate = <T extends {
  created_at: Date
  updated_at: Date
}>(data: T): T => {
  data.created_at = new Date(data.created_at.toString())
  data.updated_at = new Date(data.updated_at.toString())
  return data
}

export default function RoomCollectionStore(payload: {
  room_uuid: string
  user_uuid: string
}) {
  const state = reactive<{
    ready: boolean
    users: User[]
    chats: Chat[]
    changeLogs: ChangeLog[]
    mapMasks: MapMask[]
    playBoards: PlayBoard[]
    mapLines: MapLine[]
  }>({
       ready     : false,
       users     : [],
       chats     : [],
       changeLogs: [],
       mapMasks  : [],
       playBoards: [],
       mapLines  : [],
     })

  const axios: any            = inject('axios')
  const reloadRoomCollections = async () => {
    try {
      state.chats.splice(0, state.chats.length)
      state.changeLogs.splice(0, state.changeLogs.length)
      const { data } = await axios.get(`/api/v1/room_collections/${payload.room_uuid}`)
      //      console.log(JSON.stringify(data, null, '  '))
      state.users.splice(0, state.users.length, ...data.users.map((d: any) => changeDate(d)))
      state.chats.splice(0, state.chats.length, ...data.chats.map((d: any) => changeDate(d)))
      state.changeLogs.splice(0, state.changeLogs.length, ...data.change_logs)
      state.mapMasks.splice(0, state.mapMasks.length, ...data.map_masks.map((d: any) => changeDate(d)))
      state.playBoards.splice(0, state.playBoards.length, ...data.play_boards.map((d: any) => changeDate(d)))
      state.mapLines.splice(0, state.mapLines.length, ...data.map_lines.map((d: any) => changeDate(d)))
    } catch (err) {
      console.log(JSON.stringify(err, null, '  '))
    }
  }
  reloadRoomCollections().then(() => {
    state.ready = true
  })

  const cable: any = inject('cable')

  const roomChannelSubscriptionHandler = {
    received(data: any) {
      switch (data.table) {
        case 'api_v1_users':
          basicDataHandler(data, state.users)
          break
        case 'api_v1_chats':
          basicDataHandler(data, state.chats)
          break
        case 'api_v1_change_logs':
          basicDataHandler(data, state.changeLogs)
          break
        case 'api_v1_map_masks':
          basicDataHandler(data, state.mapMasks)
          break
        case 'api_v1_play_boards':
          basicDataHandler(data, state.playBoards)
          break
        case 'api_v1_map_lines':
          basicDataHandler(data, state.mapLines)
          break
        default:
          console.log(`ignore: [${data.table}]-[${data.type}]`)
      }
    },
  }
  cable.subscriptions.create({
                               channel  : 'RoomChannel',
                               room_uuid: payload.room_uuid,
                             }, roomChannelSubscriptionHandler)

  const chatFunctions      = createChatFunctions(payload)
  const changeLogFunctions = createChangeLogFunctions()
  const mapMaskFunctions   = createMapMaskFunctions(payload)
  const playBoardFunctions = createPlayBoardFunctions(payload)
  const mapLineFunctions   = createMapLineFunctions(payload)
  return {
    ...chatFunctions, ...changeLogFunctions, ...mapMaskFunctions, ...playBoardFunctions, ...mapLineFunctions,
    ready     : computed(() => state.ready),
    users     : computed(() => state.users),
    chats     : computed(() => state.chats),
    mapMasks  : computed(() => state.mapMasks),
    mapLines  : computed(() => state.mapLines),
    playBoards: computed(() => state.playBoards),
    changeLogs: computed(() => state.changeLogs),
  }
}

export function basicDataHandler<T extends { uuid: string, updated_at: Date, created_at: Date }>(data: { type: string, uuid: string, data: T },
                                                                                                 list: T[],
) {
  switch (data.type) {
    case 'create-data':
      list.push(changeDate(data.data))
      return true
    case 'destroy-data':
      const index = list.findIndex(r => r.uuid === data.uuid)
      if (index >= 0) {
        list.splice(index, 1)
      }
      return true
    case 'update-data':
      list.splice(list.findIndex(r => r.uuid === data.data.uuid), 1, changeDate(data.data))
      return true
  }
}

export type StoreType = ReturnType<typeof RoomCollectionStore>
export const InjectionKeySymbol: InjectionKey<StoreType> = Symbol('RoomCollectionStore')