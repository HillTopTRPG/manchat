import { computed, InjectionKey, reactive } from 'vue'
import { uuid } from 'vue-uuid'
import { Nav } from '~/pages/AccountHelper'

export default function SessionStore() {
  const state = reactive<{
    session_uuid: string
    room_uuid: string | undefined
    user_uuid: string | undefined
    nav1: string | 'room-info' | undefined
    nav2: Nav | undefined
  }>({
       session_uuid: uuid.v4(),
       room_uuid   : undefined,
       user_uuid   : undefined,
       nav1        : undefined,
       nav2        : undefined,
     })

  const room_uuid = computed({
                               get: () => state.room_uuid,
                               set: (value: string | undefined) => state.room_uuid = value,
                             })
  const user_uuid = computed({
                               get: () => state.user_uuid,
                               set: (value: string | undefined) => state.user_uuid = value,
                             })

  const nav1 = computed({
                          get: () => state.nav1,
                          set: (value: string | 'room-info' | undefined) => state.nav1 = value,
                        })
  const nav2 = computed({
                          get: () => state.nav2,
                          set: (value: Nav | undefined) => state.nav2 = value,
                        })

  return {
    session_uuid: computed(() => state.session_uuid),
    room_uuid,
    user_uuid,
    nav1,
    nav2,
    navType     : computed(() => {
      if (state.nav1 === 'room-info') {
        return 'room'
      }
      return state.nav1 === state.user_uuid ? 'player' : 'other-player'
    }),
  }
}

export type StoreType = ReturnType<typeof SessionStore>
export const InjectionKeySymbol: InjectionKey<StoreType> = Symbol('SessionStore')