import { inject, InjectionKey, reactive } from 'vue'

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

export default function UserStore(room_uuid: string) {

  const state = reactive<{
    users: User[]
  }>({
       users: [],
     })

  const axios: any = inject('axios')
  axios
    .get(`/api/v1/users.json?room_uuid=${room_uuid}`)
    .then((response: { data: any }) => {
      state.users.push(...response.data)
      console.log(JSON.stringify(state.users, null, '  '))
    })
    .catch((err: any) => {
      console.log(JSON.stringify(err, null, '  '))
    })

  const cable   = inject('cable') as any
  const channel = cable
    .subscriptions
    .create({
              channel: 'RoomChannel',
              room_uuid,
            }, {
              received(data: any) {
                console.log('- RoomChannel Received ----------')
                console.log(JSON.stringify(data, null, '  '))
                if (data.type === 'create-data') {
                  state.users.push(data.data)
                }
                if (data.type === 'destroy-data') {
                  state.users.splice(state.users.findIndex(r => r.uuid === data.uuid), 1)
                }
                console.log('- RoomChannel Received ----------')
              },

              speak(message: string) {
                return this.perform('speak', { message: message })
              },
            })

  const speak = (message: string) => {
    channel.speak(message)
  }

  return {
    state,
    speak,
  }
}

export type StoreType = ReturnType<typeof UserStore>
export const InjectionKeySymbol: InjectionKey<StoreType> = Symbol('UserStore')