import { provide } from 'vue'
import CounterStore, { InjectionKeySymbol as counterKey } from './count'
import UserStore, { InjectionKeySymbol as userKey, User } from './user'
import { Room } from '~/data/room'

export default function (room: Room | null, users: User[]) {
  provide(counterKey, CounterStore())
  provide(userKey, UserStore(users))
}