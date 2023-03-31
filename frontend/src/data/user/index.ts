import { InjectionKey, reactive } from 'vue'

export type User = {
  id: number
  uuid: string
  name: string
  user_type: string
  room_uuid: string
  log_in_count: number
  last_logged_in: Date
  created_at: Date
  updated_at: Date
}

export default function UserStore(_users: User[]) {

  const state = reactive<{
    users: User[]
  }>({
       users: _users,
     })

  return {
    state,
  }
}

export type StoreType = ReturnType<typeof UserStore>
export const InjectionKeySymbol: InjectionKey<StoreType> = Symbol('UserStore')