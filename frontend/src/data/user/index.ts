import { reactive, InjectionKey, inject } from "vue"

export default function UserStore() {

  const state = reactive<{
    json: {
      id: number;
      uuid: string;
      name: string;
      password: string;
      room_uuid: string;
      last_logged_in: Date;
      created_at: Date;
      updated_at: Date;
    }[];
  }>({
    json: []
  })

  const axios: any = inject('axios')
  axios
    .get("http://localhost:81/api/v1/users.json")
    .then((response: { data: any }) => {
      state.json.push(...response.data)
    })
    .catch((err: any) => {
      console.log(JSON.stringify(err, null, "  "))
    })

  const cable: any = inject('cable')
  const channel = cable.subscriptions.create({ channel: "RoomChannel", room_uuid: "room-001" }, {
    connected() {
      console.log("- RoomChannel Connected ----------at user")
    },

    disconnected() {
      console.log("- RoomChannel Disconnected ----------")
    },

    received(data: any) {
      console.log("- RoomChannel Received ----------")
      console.log(JSON.stringify(data, null, "  "))
      console.log("- RoomChannel Received ----------")
    },

    speak(message: string) {
      return this.perform('speak', {message: message});
    }
  });

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