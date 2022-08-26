import {reactive, InjectionKey, inject, watch} from "vue"

export default function RoomStore() {
  const state = reactive<{
    autoSynchronize: boolean;
    rooms: {
      id: number;
      uuid: string;
      name: string;
      password: string;
      last_logged_in: Date;
      created_at: Date;
      updated_at: Date;
    }[];
  }>({
    autoSynchronize: true,
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
    } catch (err) {
      console.log(JSON.stringify(err, null, "  "))
    }
  }
  reloadRoomList().then()

  watch(() => state.autoSynchronize, (newValue) => {
    if (newValue) {
      reloadRoomList()
    }
  })

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
  }
}

export type StoreType = ReturnType<typeof RoomStore>
export const InjectionKeySymbol: InjectionKey<StoreType> = Symbol('RoomStore')