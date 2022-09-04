import { provide } from 'vue'
import CounterStore, { InjectionKeySymbol as counterKey } from './count'
import UserStore, { InjectionKeySymbol as userKey } from './user'

export default function (room_uuid: string) {
  provide(counterKey, CounterStore())
  provide(userKey, UserStore(room_uuid))
}