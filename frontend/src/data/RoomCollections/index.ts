import { computed, inject, InjectionKey, reactive } from 'vue'
import { Chat, createChatFunctions } from '~/data/RoomCollections/Chat'
import { ChangeLog, createChangeLogFunctions } from '~/data/RoomCollections/ChangeLog'
import { User } from '~/data/user'

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
  }>({
       ready     : false,
       users     : [],
       chats     : [],
       changeLogs: [],
     })

  const axios: any            = inject('axios')
  const reloadRoomCollections = async () => {
    try {
      state.chats.splice(0, state.chats.length)
      state.changeLogs.splice(0, state.changeLogs.length)
      const { data } = await axios.get(`/api/v1/room_collections/${payload.room_uuid}`)
      console.log(JSON.stringify(data, null, '  '))
      state.users.splice(0, state.users.length, ...data.users.map((d: any) => changeDate(d)))
      state.chats.splice(0, state.chats.length, ...data.chats.map((d: any) => changeDate(d)))
      state.changeLogs.splice(0, state.changeLogs.length, ...data.change_logs)
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
      console.log(JSON.stringify(data, null, '  '))
      console.log(`[${data.table}]-[${data.type}]`)
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
        default:
          console.log(`ignore: [${data.table}]-[${data.type}]`)
      }
    },
  }
  cable.subscriptions.create({
                               channel  : 'RoomChannel',
                               room_uuid: payload.room_uuid,
                             }, roomChannelSubscriptionHandler)

  return {
    ready     : computed(() => state.ready),
    users     : computed(() => state.users),
    chats     : computed(() => state.chats),
    changeLogs: computed(() => state.changeLogs), ...createChatFunctions(state, payload), ...createChangeLogFunctions(
      state),
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