import { reactive, InjectionKey } from "vue"

export default function useCounter() {
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

export type Store = ReturnType<typeof useCounter>
export const InjectionKeySymbol: InjectionKey<Store> = Symbol('CounterStore')