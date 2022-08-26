import { reactive, InjectionKey } from "vue"

export default function CounterStore() {
  const state = reactive<{
    count: number;
  }>({
    count: 0
  })

  const increment = () => state.count++
  const decrement = () => state.count--

  return {
    state,
    increment,
    decrement,
  }
}

export type StoreType = ReturnType<typeof CounterStore>
export const InjectionKeySymbol: InjectionKey<StoreType> = Symbol('CounterStore')