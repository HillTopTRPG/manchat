import { getRoomBaseParams, RoomProps } from '~/pages/AccountHelper'
import { merge, pick } from 'lodash'

export type Chat = {
  uuid: string
  room_uuid: string
  tab: string | null
  raw: string
  owner_user: string | null
  owner_character: string | null
  target_type: string | null
  target_uuid: string | null
  secret: number
  ref_uuid: string | null
  attached: any | null
  reactions: any | null
  created_at: Date
  updated_at: Date
}

const sendChatParams = [
  'tab', 'raw', 'owner_character', 'target_type', 'target_uuid', 'secret',
] as const

export function createChatFunctions(args: RoomProps) {
  const sendChat   = async (payload: Pick<Chat, typeof sendChatParams[number]> & { axios: any }) => {
    const { data } = await payload.axios.post(`/api/v1/chats`, merge(getRoomBaseParams(args), {
      record: pick(payload, ...sendChatParams),
    }))
    if (data.verify !== 'success') {
      console.log(JSON.stringify(data, null, '  '))
    }
  }
  const deleteChat = async (payload: { axios: any, chat_uuid: string }) => {
    await payload.axios.delete('/api/v1/chats', {
      data: merge(getRoomBaseParams(args), { uuids: [payload.chat_uuid] }),
    })
  }
  return {
    sendChat,
    deleteChat,
  }
}
