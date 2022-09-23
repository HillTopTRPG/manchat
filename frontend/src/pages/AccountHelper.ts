import { ComputedRef, Ref } from 'vue'
import Router from 'router'
import { merge, pick } from 'lodash'
import { User } from '~/data/user'
import { Room } from '~/data/room'

export type Nav =
  'init'
  | 'entrance'
  | 'profile'
  | 'room-basic'
  | 'notification'

type Env = {
  axios: any
  router: typeof Router
}

export type RoomProps = {
  room_uuid: string
  user_uuid?: string
  user_name?: string
  user_password?: string
  nav1?: string | 'room-info'
  nav2?: Nav
  rail?: string
}

export async function requestUserLoginWrap(args: Env & RoomProps & {
  subscription_uuid: string
  loginAlertType: Ref<string>
  loginAlertText: Ref<string>
  userNameInput: Ref<HTMLInputElement | undefined>
  userPasswordInput: Ref<HTMLInputElement | undefined>
}): Promise<{ user_uuid: string } | null> {
  let result: { user_uuid: string, user_token: string } | null = null

  const { room_token } = JSON.parse(localStorage.getItem(args.room_uuid) || '{}')

  if (room_token === undefined) {
    toLobby(args, true).then()
    return null
  }

  if (args.user_uuid === undefined) {
    if (!args.user_name) {
      args.loginAlertType.value = 'warning'
      args.loginAlertText.value = 'ユーザー名を入力してください。'
      return null
    }
  }

  args.loginAlertType.value = 'info'
  args.loginAlertText.value = 'ログイン中'
  if (args.user_uuid !== undefined) {
    const data = await requestUserLogin(merge({}, args, { room_token }))
    if (data === null) {
      return null
    }
    if (data === 'invalid_password') {
      args.loginAlertType.value = 'error'
      args.loginAlertText.value = 'ユーザーパスワードが違います'
      args.userPasswordInput.value?.select()
      return null
    }
    if (typeof data === 'string') {
      args.loginAlertType.value = 'error'
      args.loginAlertText.value = 'ユーザーログインに失敗しました。'
      return null
    }
    result = {
      user_uuid : args.user_uuid,
      user_token: data.user_token,
    }
  } else {
    const data = await requestUserCreate(merge({}, args, { room_token }))
    if (data === null) {
      return null
    }
    if (typeof data === 'string') {
      args.loginAlertType.value = 'error'
      args.loginAlertText.value = 'ユーザー作成に失敗しました。'
      args.userNameInput.value?.select()
      return null
    }
    result = {
      user_uuid : data.user.uuid,
      user_token: data.user_token,
    }
  }
  localStorage.setItem(result.user_uuid, JSON.stringify(pick(result, 'user_token')))
  return pick(result, 'user_uuid')
}

async function requestUserLogin(args: Env & RoomProps & {
  subscription_uuid: string
  room_token: string
}): Promise<any | string | null> {
  const { data } = await args.axios.post(`/api/v1/users/${args.user_uuid}/login`,
                                         merge(pick(args, 'room_uuid', 'room_token', 'subscription_uuid'), {
                                           password: args.user_password,
                                         }),
  )
  //  console.log(JSON.stringify(data, null, '  '))
  if (data.verify !== 'success') {
    if (data.reason === 'expire_room_token') {
      toLobby(args, true).then()
      return null
    }
  }
  return data.verify === 'success' ? data : data.reason
}

async function requestUserCreate(args: Env & RoomProps & { subscription_uuid: string }): Promise<any | string | null> {
  const { data } = await args.axios.post(`/api/v1/users`, merge(pick(args, 'room_token', 'subscription_uuid'), {
    api_v1_user: {
      name     : args.user_name,
      password : args.user_password,
      room_uuid: args.room_uuid,
    },
  }))
  //  console.log(JSON.stringify(data, null, '  '))
  if (data.verify !== 'success') {
    switch (data.reason) {
      case 'no_such_room':
        toLobby(args, false).then()
        return null
      case 'expire_room_token':
        toLobby(args, true).then()
        return null
      default:
    }
    return
  }
  return data.verify === 'success' ? data : data.reason
}

export const toLobby = (args: Omit<RoomProps, 'room_uuid'> & { router: typeof Router, room_uuid?: string },
                        hasQuery: boolean,
) => args.router.replace({
                           name : 'lobby',
                           query: hasQuery ? merge(toRoomQuery(args), { r: args.room_uuid }) : undefined,
                         })

const toRoomUserQuery = (args: Omit<RoomProps, 'room_uuid'>) => (
  {
    n   : args.user_name,
    p   : args.user_password,
    nav1: args.nav1,
    nav2: args.nav2,
    rail: args.rail,
  }
)

const toRoomQuery = (args: Omit<RoomProps, 'room_uuid'>) => (
  {
    u: args.user_uuid, ...toRoomUserQuery(args),
  }
)

export async function toRoom(args: RoomProps & { router: typeof Router }, hasQuery: boolean) {
  return args.router.replace({
                               name  : 'room',
                               params: pick(args, 'room_uuid'),
                               query : hasQuery ? toRoomQuery(args) : undefined,
                             })
}

export async function toRoomUser(args: RoomProps & { router: typeof Router }, hasQuery: boolean) {
  return args.router.replace({
                               name  : 'room-user',
                               params: pick(args, 'room_uuid', 'user_uuid'),
                               query : hasQuery ? toRoomUserQuery(args) : undefined,
                             })
}

export async function toPlay(args: RoomProps & { router: typeof Router }) {
  return args.user_uuid && args.router.replace({
                                                 name  : 'play',
                                                 params: pick(args, 'room_uuid', 'user_uuid'),
                                               })
}

export function getTokens(args: RoomProps) {
  const { room_token } = JSON.parse(localStorage.getItem(args.room_uuid) || '{}')
  const { user_token } = JSON.parse(localStorage.getItem(args.user_uuid || '') || '{}')
  return {
    room_token,
    user_token,
  }
}

export async function requestUserTokenCheck(args: {
  axios: any
  subscription_uuid: string
  room_uuid: string
  user_uuid?: string | undefined
}) {
  const tokens = getTokens(args)
  if (!tokens.user_token) {
    return null
  }
  const { data } = await args.axios.post(`/api/v1/users/${args.user_uuid}/token/${tokens.user_token}/check`,
                                         merge(pick(args, 'room_uuid', 'subscription_uuid'),
                                               pick(tokens, 'room_token'),
                                         ),
  )
  //  console.log(JSON.stringify(data, null, '  '))
  return data
}

export async function requestTokenCheckWrap(args: Env & RoomProps & {
  subscription_uuid: string
  room: Ref<Room | null>
  users: Ref<User[]>
  userLoggedInFlg: Ref<boolean>
  selectedNav1: Ref<string[]>
  selectedNav2: Ref<Nav[]>
}): Promise<string | null> {
  args.selectedNav2.value.splice(0, args.selectedNav2.value.length, 'init')
  const {
          room_token,
          user_token,
        } = getTokens(args)

  if (!room_token) {
    toLobby(args, true).then()
    return 'expire_room_token'
  }

  if (!user_token) {
    const { data } = await args.axios.post(`/api/v1/rooms/${args.room_uuid}/token/${room_token}/check`)
    //    console.log(JSON.stringify(data, null, '  '))

    if (data.verify !== 'success') {
      toLobby(args, data.reason !== 'no_such_room').then()
      return data.reason
    }

    args.room.value = data.room
    args.users.value.splice(0, args.users.value.length, ...data.users)

    toRoom(args, true).then()
    switch (args.nav2) {
      case 'profile':
      case 'notification':
      case 'room-basic':
        args.selectedNav2.value.splice(0, args.selectedNav2.value.length, args.nav2)
        break
      default:
        args.selectedNav2.value.splice(0, args.selectedNav2.value.length, 'entrance')
        break
    }
    return null
  } else {
    const { data } = await args.axios.post(`/api/v1/users/${args.user_uuid}/token/${user_token}/check`, {
      room_uuid        : args.room_uuid,
      room_token,
      subscription_uuid: args.subscription_uuid,
    })
    //    console.log(JSON.stringify(data, null, '  '))

    if (data.room && data.users) {
      args.room.value = data.room
      args.users.value.splice(0, args.users.value.length, ...data.users)
    }

    const isSuccess            = data.verify === 'success'
    args.userLoggedInFlg.value = isSuccess
    if (isSuccess) {
      args.selectedNav1.value.splice(0, args.selectedNav1.value.length, args.nav1 || args.user_uuid!)
      args.router.replace({
                            name  : 'room-user',
                            params: pick(args, 'room_uuid', 'user_uuid'),
                            query : pick(args, 'nav1', 'nav2'),
                          }).then()
      switch (args.nav2) {
        case 'profile':
        case 'notification':
        case 'room-basic':
          args.selectedNav2.value.splice(0, args.selectedNav2.value.length, args.nav2)
          break
        default:
          args.selectedNav2.value.splice(0, args.selectedNav2.value.length)
          break
      }
      return null
    }
    args.selectedNav2.value.splice(0, args.selectedNav2.value.length, 'entrance')
    args.selectedNav1.value.splice(0, args.selectedNav1.value.length)
    if (data.reason === 'expire_room_token' || data.reason === 'no_such_room') {
      toLobby(args, data.reason.startsWith('expire')).then()
    }
    if (data.reason === 'expire_user_token' || data.reason === 'no_such_user') {
      toRoom(args, data.reason.startsWith('expire')).then()
    }
    return data.reason
  }
}

export async function roomPatch(args: Env & RoomProps, room: Room | null, updateUser: Partial<{
  name: string
}>) {
  args.axios.patch(`/api/v1/rooms/${args.room_uuid}`, merge(pick(args, 'room_uuid', 'user_uuid'), getTokens(args), {
    api_v1_room: merge(pick(room, 'name'), updateUser),
  })).then((data: any) => {
    //    console.log(JSON.stringify(data.data, null, '  '))
    if (data.data.verify === 'success') {
      return
    }
    const reason = data.data.reason
    if (reason === 'expire_room_token' || reason === 'no_such_room') {
      return toLobby(args, reason === 'expire_room_token')
    }
    if (reason === 'expire_user_token' || reason === 'no_such_user') {
      return toRoom(args, reason === 'expire_user_token')
    }
    if (reason === 'unauthorized_operations') {
      return
    }
  })
}

export async function userPatch(args: Env & RoomProps, user: ComputedRef<User | undefined>, updateUser: Partial<{
  name: string
  user_type: string
}>, expireUserTokenCallback: () => void) {
  args.axios.patch(`/api/v1/users/${args.user_uuid}`, merge(pick(args, 'room_uuid', 'user_uuid'), getTokens(args), {
    api_v1_user: merge(pick(user.value, 'name', 'user_type'), updateUser),
  })).then((data: any) => {
    if (data.data.verify !== 'success') {
      //      console.log(JSON.stringify(data.data, null, '  '))
      const reason = data.data.reason
      if (reason === 'expire_room_token' || reason === 'no_such_room') {
        return toLobby(args, reason === 'expire_room_token')
      }
      if (reason === 'no_such_user') {
        return toRoom(args, false)
      }
      reason === 'expire_user_token' && expireUserTokenCallback()
    }
  })
}

export async function roomDelete(args: Env & RoomProps) {
  args.axios.delete(`/api/v1/rooms/${args.room_uuid}`, { data: merge(pick(args, 'user_uuid'), getTokens(args)) })
      .then((data: any) => {
        //        console.log(JSON.stringify(data.data, null, '  '))
        if (data.verify === 'success') {
          return
        }
        //        const reason = data.data.reason
        //        return toLobby(args, reason === 'expire_room_token')
      })
}

export async function userDelete(args: Env & RoomProps) {
  args.axios.delete(`/api/v1/users/${args.user_uuid}`, { data: merge(pick(args, 'room_uuid'), getTokens(args)) })
      .then((data: any) => {
        //        console.log(JSON.stringify(data.data, null, '  '))
        const reason = data.data.reason
        if (reason === 'expire_room_token' || reason === 'no_such_room') {
          return toLobby(args, reason === 'expire_room_token')
        }
        return toRoom(args, reason === 'expire_user_token')
      })
}

export const userSort = (users: Ref<User[] | undefined>) => {
  const userTypeOrder = ['master', 'player', 'visitor']
  users.value?.sort((u1, u2) => {
    const u1Type = userTypeOrder.findIndex(t => t === u1.user_type)
    const u2Type = userTypeOrder.findIndex(t => t === u2.user_type)
    switch (true) {
      case u1Type > u2Type:
        return 1
      case u1Type < u2Type:
        return -1
      default:
        return u1.id > u2.id ? 1 : -1
    }
  })
}

export function createRoomChannel(args: RoomProps & {
  router: typeof Router
  cable: any
  room: Ref<Room | null>
  users: Ref<User[]>
}) {
  const roomChannelSubscriptionHandler = {
    received(data: any) {
      //      console.log(JSON.stringify(data, null, '  '))
      //      console.log(`[${data.table}]-[${data.type}]`)
      switch (`[${data.table}]-[${data.type}]`) {
        case '[api_v1_users]-[create-data]':
          args.users.value.push(data.data)
          userSort(args.users)
          break
        case '[api_v1_users]-[destroy-data]':
          const index = args.users.value.findIndex(r => r.uuid === data.uuid)
          if (index < 0) {
            return
          }
          args.users.value.splice(index, 1)
          if (data.uuid === args.user_uuid) {
            toRoom(args, false).then()
          }
          break
        case '[api_v1_rooms]-[destroy-data]':
          args.room.value = null
          toLobby(args, false).then()
          break
        case '[api_v1_users]-[update-data]':
          args.users.value.splice(args.users.value.findIndex(r => r.uuid === data.data.uuid), 1, data.data)
          userSort(args.users)
          break
        case '[api_v1_rooms]-[update-data]':
          args.room.value = data.data
          break
        default:
          console.log(`ignore: [${data.table}]-[${data.type}]`)
          break
      }
    },
  }

  return args.cable.subscriptions.create({
                                           channel  : 'RoomChannel',
                                           room_uuid: args.room_uuid,
                                         }, roomChannelSubscriptionHandler)
}

export function createUserChannel(args: RoomProps & {
  router: typeof Router
  cable: any
  subscription_uuid: string
}) {
  const userChannelSubscriptionHandler = {
    received(data: any) {
      //      console.log(JSON.stringify(data, null, '  '))
      switch (data.type) {
        case 'notify_connection_info':
          if (data.value === 'invalid-room-token' || data.value === 'room-deleted') {
            return toLobby(args, data.value === 'invalid-room-token')
          }
          if (data.value === 'invalid-user-token' || data.value === 'user-deleted') {
            return toRoom(args, data.value === 'invalid-user-token')
          }
          break
        default:
      }
    },
  }

  return args.cable.subscriptions.create(
    merge(pick(args, 'room_uuid', 'user_uuid', 'subscription_uuid'), getTokens(args), { channel: 'UsersChannel' }),
    userChannelSubscriptionHandler,
  )
}

export interface UserTypeSelection {
  title: string
  value: string
  hint: string
}

export const userTypeSelection: UserTypeSelection[] = [
  {
    title: 'マスター',
    value: 'master',
    hint : '特別な操作が許可されます。',
  }, {
    title: 'プレイヤー',
    value: 'player',
    hint : '',
  }, {
    title: '見学者',
    value: 'visitor',
    hint : '閲覧のみ許可されます。',
  },
]
