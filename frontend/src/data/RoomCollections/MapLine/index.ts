import { getRoomBaseParams, RoomProps } from '~/pages/AccountHelper'
import { merge, pick } from 'lodash'

export type MapLine = {
  uuid: string
  room_uuid: string
  play_board_uuid: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  created_at: Date
  updated_at: Date
}

export const sendParams = [
  'play_board_uuid', 'x1', 'y1', 'x2', 'y2', 'color',
] as const

export function createMapLineFunctions(args: RoomProps) {
  const addMapLine    = async (payload: Pick<MapLine, typeof sendParams[number]> & { axios: any }) => {
    const { data } = await payload.axios.post(`/api/v1/map_lines`, merge(getRoomBaseParams(args), {
      record: pick(payload, ...sendParams),
    }))
    if (data.verify !== 'success') {
      console.log(JSON.stringify(data, null, '  '))
    }
  }
  const deleteMapLine = async (payload: { axios: any, map_line_uuid: string }) => {
    await payload.axios.delete('/api/v1/map_lines', {
      data: merge(getRoomBaseParams(args), { uuids: [payload.map_line_uuid] }),
    })
  }
  const updateMapLine = async (payload: Pick<MapLine, typeof sendParams[number]> & { axios: any, map_line_uuid: string }) => {
    await payload.axios.patch(`/api/v1/map_lines/${payload.map_line_uuid}`, merge(getRoomBaseParams(args), {
      api_v1_map_line: pick(payload, ...sendParams),
    }))
  }
  return {
    addMapLine,
    updateMapLine,
    deleteMapLine,
  }
}
