import { getRoomBaseParams, RoomProps } from '~/pages/AccountHelper'
import { merge, pick } from 'lodash'

export type PlayBoard = {
  uuid: string
  room_uuid: string
  owner_user: string | null
  name: string
  board_type: string
  width: number
  height: number
  screen_color: string
  bg_color: string
  border_color: string
  created_at: Date
  updated_at: Date
}

export const sendParams = [
  'name', 'board_type', 'width', 'height', 'screen_color', 'bg_color', 'border_color',
] as const

export function createPlayBoardFunctions(args: RoomProps) {
  const addPlayBoard    = async (payload: Pick<PlayBoard, typeof sendParams[number]> & { axios: any }) => {
    const { data } = await payload.axios.post(`/api/v1/play_boards`, merge(getRoomBaseParams(args), {
      record: pick(payload, ...sendParams),
    }))
    if (data.verify !== 'success') {
      console.log(JSON.stringify(data, null, '  '))
    }
  }
  const deletePlayBoard = async (payload: { axios: any, play_board_uuid: string }) => {
    await payload.axios.delete('/api/v1/play_boards', {
      data: merge(getRoomBaseParams(args), { uuids: [payload.play_board_uuid] }),
    })
  }
  const updatePlayBoard = async (payload: Pick<PlayBoard, typeof sendParams[number]> & { axios: any, play_board_uuid: string }) => {
    await payload.axios.patch(`/api/v1/play_boards/${payload.play_board_uuid}`, merge(getRoomBaseParams(args), {
      api_v1_play_board: pick(payload, ...sendParams),
    }))
  }
  return {
    addPlayBoard,
    updatePlayBoard,
    deletePlayBoard,
  }
}
