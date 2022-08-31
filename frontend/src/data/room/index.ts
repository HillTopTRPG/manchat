import {reactive, InjectionKey, inject, watch} from 'vue'

export default function RoomStore() {
  const state = reactive<{
    ready: boolean;
    favoriteRooms: string[];
    loggedInRooms: string[];
    rooms: {
      id: number;
      name: string;
      uuid: string;
      last_logged_in: Date;
      created_at: Date;
      updated_at: Date;
    }[];
  }>({
    ready: false,
    favoriteRooms: [],
    loggedInRooms: [],
    rooms: [],
  })

  const localStorageFavoriteRoomsString = localStorage.getItem('favorite-rooms')
  if (localStorageFavoriteRoomsString) {
    state.favoriteRooms = JSON.parse(localStorageFavoriteRoomsString)
  } else {
    localStorage.setItem('favorite-rooms', '[]')
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    try {
      const { room_token } = JSON.parse(localStorage.getItem(key) || '{}')
      if (room_token) state.loggedInRooms.push(key)
    } catch (err) {
      // Nothing
    }
  }

  const axios: any = inject('axios')
  const reloadRoomList = async () => {
    try {
      state.rooms.splice(0, state.rooms.length)
      const response: { data: any } = await axios.get('http://localhost:81/api/v1/rooms.json')
      state.rooms.push(...response.data)
      state.loggedInRooms
        .filter(room => !state.rooms.some(r => r.uuid === room))
        .forEach(dRoom => {
          state.loggedInRooms.splice(state.loggedInRooms.findIndex(r => r === dRoom), 1)
          localStorage.removeItem(dRoom)
        })
      state.favoriteRooms
        .filter(room => !state.rooms.some(r => r.uuid === room))
        .forEach(dRoom => {
          state.favoriteRooms.splice(state.favoriteRooms.findIndex(r => r === dRoom), 1)
          localStorage.removeItem(dRoom)
        })
      const sortFunc = (u1: string, u2: string) => (state.rooms.find(r => r.uuid === u1)?.id || 0) > (state.rooms.find(r => r.uuid === u2)?.id || 0) ? 1 : -1
      state.loggedInRooms.sort(sortFunc)
      state.favoriteRooms.sort(sortFunc)
    } catch (err) {
      console.log(JSON.stringify(err, null, '  '))
    }
  }
  reloadRoomList().then(() => {
    state.ready = true
  })

  watch(() => state.favoriteRooms, () => localStorage.setItem('favorite-rooms', JSON.stringify(state.favoriteRooms)), { deep: true })
  const changeRoomFavorite = (room_uuid: string) => {
    if (state.favoriteRooms.some(uuid => uuid === room_uuid)) {
      state.favoriteRooms.splice(state.favoriteRooms.findIndex(uuid => uuid === room_uuid), 1)
    } else {
      state.favoriteRooms.push(room_uuid)
    }
    state.favoriteRooms.sort((uuid1, uuid2) => (state.rooms.find(r => r.uuid === uuid1)?.id || 0) > (state.rooms.find(r => r.uuid === uuid2)?.id || 0) ? 1 : -1)
  }

  const cable: any = inject('cable')
  cable.subscriptions.create({ channel: 'RoomsChannel' }, {
    connected() {},
    disconnected() {},
    received(data: any) {
      if (data.type === 'create-data') {
        state.rooms.push(data.data)
      }
      if (data.type === 'destroy-data') {
        state.rooms.splice(state.rooms.findIndex(r => r.uuid === data.uuid), 1)
      }
    },
  })

  return {
    state,
    reloadRoomList,
    changeRoomFavorite,
  }
}

export type StoreType = ReturnType<typeof RoomStore>
export const InjectionKeySymbol: InjectionKey<StoreType> = Symbol('RoomStore')