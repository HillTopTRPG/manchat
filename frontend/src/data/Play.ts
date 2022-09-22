import { provide } from 'vue'
import CounterStore, { InjectionKeySymbol as counterKey } from './count'
import UserStore, { InjectionKeySymbol as userKey, User } from './user'
import RoomCollections, { InjectionKeySymbol as roomCollectionsKey } from './RoomCollections'

export default function (payload: {
  room_uuid: string
  user_uuid: string
  user_name?: string
  user_password?: string
  users: User[]
}) {
  provide(counterKey, CounterStore())
  provide(userKey, UserStore(payload.users))
  provide(roomCollectionsKey, RoomCollections(payload))
}