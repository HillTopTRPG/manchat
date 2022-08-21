import { provide } from "vue";
import useCounter, { InjectionKeySymbol as counterKey } from './count'

export default function() {
  provide(counterKey, useCounter())
}