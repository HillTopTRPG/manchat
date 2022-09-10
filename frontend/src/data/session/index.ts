import { InjectionKey, reactive } from 'vue'
import { uuid } from 'vue-uuid'

export default function SessionStore() {

  const state = reactive<{
    session_uuid: string
  }>({
       session_uuid: uuid.v4(),
     })

  return {
    state,
  }
}

export type StoreType = ReturnType<typeof SessionStore>
export const InjectionKeySymbol: InjectionKey<StoreType> = Symbol('SessionStore')