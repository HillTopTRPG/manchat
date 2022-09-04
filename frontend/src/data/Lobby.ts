import { provide } from 'vue'
import RoomStore, { InjectionKeySymbol as RoomKey } from './room'

export default function () {
  provide(RoomKey, RoomStore())
}