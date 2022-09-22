import { getTokens, RoomProps } from '~/pages/AccountHelper'
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

export function createChatFunctions(state: { chats: Chat[] }, args: RoomProps) {
  const sendChat = async (payload: Pick<Chat, 'tab' | 'raw' | 'owner_character' | 'target_type' | 'target_uuid' | 'secret'> & { axios: any }) => {
    const { data } = await payload.axios.post(`/api/v1/chats`,
                                              merge(pick(args, 'room_uuid', 'user_uuid'), getTokens(args), {
                                                api_v1_chat: pick(payload,
                                                                  'tab',
                                                                  'raw',
                                                                  'owner_character',
                                                                  'target_type',
                                                                  'target_uuid',
                                                                  'secret',
                                                ),
                                              }),
    )
    console.log(JSON.stringify(data, null, '  '))
  }
  return {
    sendChat,
  }
}
