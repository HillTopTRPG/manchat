import { reactive, InjectionKey, inject } from "vue"

export default function useUser() {

  const state = reactive<{
    json: {
      id: number;
      uuid: string;
      name: string;
      password: string;
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
      console.log(JSON.stringify(response.data, null, "  "))
      state.json.push(...response.data)
    })
    .catch((err: any) => {
      console.log(JSON.stringify(err, null, "  "))
    })

  return {
    state,
  }
}

export type Store = ReturnType<typeof useUser>
export const InjectionKeySymbol: InjectionKey<Store> = Symbol('UserStore')