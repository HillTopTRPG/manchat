import {reactive, InjectionKey, inject, watch} from "vue"

export default function RoomStore() {
  const state = reactive<{
    ready: boolean;
    autoSynchronize: boolean;
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
      state.rooms.push(...response.data)
      state.loggedInRooms
        .filter(fUuid => !state.rooms.some(r => r.uuid === fUuid))
        .forEach(dUuid => {
          state.loggedInRooms.splice(state.loggedInRooms.findIndex(id => id === dUuid), 1)
          const localStorageData = localStorage.getItem(dUuid)
          if (localStorageData) {
            const { id } = JSON.parse(localStorageData)
            localStorage.removeItem(`room:${id}`)
          }
          localStorage.removeItem(dUuid)
        })
      state.favoriteRooms
        .filter(fUuid => !state.rooms.some(r => r.uuid === fUuid))
        .forEach(dUuid => {
          state.favoriteRooms.splice(state.favoriteRooms.findIndex(uuid => uuid === dUuid), 1)
          const localStorageData = localStorage.getItem(dUuid)
          if (localStorageData) {
            const { id } = JSON.parse(localStorageData)
            localStorage.removeItem(`room:${id}`)
          }
          localStorage.removeItem(dUuid)
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
    const { uuid } = JSON.parse(localStorage.getItem(key) || '{}')
    state.loggedInRooms.push(uuid)
  }
  state.loggedInRooms.sort()

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
  cable.subscriptions.create({ channel: "RoomsChannel" }, {
    connected() {},
    disconnected() {},
    received(data: any) {
      if (state.autoSynchronize) {
        if (data.type === "create-data") {
          state.rooms.push(data.data)
        }
        if (data.type === "destroy-data") {
          state.rooms.splice(state.rooms.findIndex(r => r.uuid === data.uuid), 1)
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