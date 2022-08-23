import { provide } from "vue";
import useCounter, { InjectionKeySymbol as counterKey } from './count'
import useUser, { InjectionKeySymbol as userKey } from './user'

export default function() {
  provide(counterKey, useCounter())
  provide(userKey, useUser())
}