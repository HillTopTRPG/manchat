import {reactive, InjectionKey, inject, watch} from "vue"

export default function RoomStore() {
  const state = reactive<{
    ready: boolean;
    autoSynchronize: boolean;
    favoriteRooms: number[];
    loggedInRooms: number[];
    rooms: {
      id: number;
      name: string;
      last_logged_in: Date;
      created_at: Date;
      updated_at: Date;
    }[];
  }>({
    ready: false,
    autoSynchronize: true,
    favoriteRooms: [],
    loggedInRooms: [],
    rooms: [],
  })

  const changeAutoSynchronize = (autoSynchronize: boolean) => {
    state.autoSynchronize = autoSynchronize
  }

  const axios: any = inject('axios')
  const reloadRoomList = async () => {
    try {
      state.rooms.splice(0, state.rooms.length)
      const response: { data: any } = await axios.get("http://localhost:81/api/v1/rooms.json")
        .catch((err: any) => {
        })
      state.rooms.push(...response.data)
      state.loggedInRooms
        .filter(fid => !state.rooms.some(r => r.id === fid))
        .forEach(dId => {
          state.loggedInRooms.splice(state.loggedInRooms.findIndex(id => id === dId), 1)
          const roomNoKey = `room:${dId}`
          const localStorageData = localStorage.getItem(roomNoKey)
          if (localStorageData) {
            const { uuid } = JSON.parse(localStorageData)
            localStorage.removeItem(uuid)
          }
          localStorage.removeItem(roomNoKey)
        })
      state.favoriteRooms
        .filter(fid => !state.rooms.some(r => r.id === fid))
        .forEach(dId => {
          state.favoriteRooms.splice(state.favoriteRooms.findIndex(id => id === dId), 1)
          const roomNoKey = `room:${dId}`
          const localStorageData = localStorage.getItem(roomNoKey)
          if (localStorageData) {
            const { uuid } = JSON.parse(localStorageData)
            localStorage.removeItem(uuid)
          }
          localStorage.removeItem(roomNoKey)
        })
    } catch (err) {
      console.log(JSON.stringify(err, null, "  "))
    }
  }
  reloadRoomList().then(() => {
    state.ready = true
  })

  watch(() => state.autoSynchronize, (newValue) => {
    if (newValue) {
      reloadRoomList().then()
    }
  })

  const localStorageFavoriteRoomsString = localStorage.getItem('favorite-rooms')
  if (localStorageFavoriteRoomsString) {
    state.favoriteRooms = JSON.parse(localStorageFavoriteRoomsString)
    state.favoriteRooms.sort()
  } else {
    localStorage.setItem('favorite-rooms', '[]')
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    if (!key.match(/room:[0-9]+/)) continue
    const roomId = parseInt(key.replace('room:', ''))
    state.loggedInRooms.push(roomId)
  }
  state.loggedInRooms.sort()

  watch(() => state.favoriteRooms, () => localStorage.setItem('favorite-rooms', JSON.stringify(state.favoriteRooms)), { deep: true })
  const changeRoomFavorite = (roomId: number) => {
    if (state.favoriteRooms.some(id => id === roomId)) {
      state.favoriteRooms.splice(state.favoriteRooms.findIndex(id => id === roomId), 1)
    } else {
      state.favoriteRooms.push(roomId)
    }
    state.favoriteRooms.sort((id1, id2) => id1 > id2 ? 1 : -1)
  }

  const cable: any = inject('cable')
  cable.subscriptions.create({ channel: "RoomsChannel" }, {
    connected() {},
    disconnected() {},
    received(data: any) {
      if (state.autoSynchronize) {
        if (data.type === "create-data") {
          state.rooms.push(data.data)
        }
        if (data.type === "destroy-data") {
          state.rooms.splice(state.rooms.findIndex(r => r.id === data.id), 1)
        }
      }
    },
  })

  return {
    state,
    changeAutoSynchronize,
    reloadRoomList,
    changeRoomFavorite,
  }
}

export type StoreType = ReturnType<typeof RoomStore>
export const InjectionKeySymbol: InjectionKey<StoreType> = Symbol('RoomStore')