import { getRoomBaseParams, RoomProps } from '~/pages/AccountHelper'
import { merge, pick } from 'lodash'
import axios from 'axios'

export type MapMask = {
  uuid: string
  room_uuid: string
  play_board_uuid: string
  owner_user: string | null
  grid_x: number
  grid_y: number
  bg_color: string
  created_at: Date
  updated_at: Date
}

export const sendParams = [
  'play_board_uuid', 'grid_x', 'grid_y', 'bg_color',
] as const

export function createMapMaskFunctions(args: RoomProps) {
  const addMapMask    = async (payload: Pick<MapMask, typeof sendParams[number]> & { axios: any }) => {
    const { data } = await payload.axios.post(`/api/v1/map_masks`, merge(getRoomBaseParams(args), {
      record: pick(payload, ...sendParams),
    }))
    if (data.verify !== 'success') {
      console.log(JSON.stringify(data, null, '  '))
    }
  }
  const addMapMasks   = async (payload: { axios: any, list: Pick<MapMask, typeof sendParams[number]>[] }) => {
    if (!payload.list.length) {
      return
    }
    const { data } = await axios({
                                   url   : '/api/v1/map_masks',
                                   method: 'POST',
                                   data  : merge(getRoomBaseParams(args), {
                                     records: payload.list.map(p => pick(p, ...sendParams)),
                                   }),
                                 })
    if (data.verify !== 'success') {
      console.log(JSON.stringify(data, null, '  '))
    }
  }
  const deleteMapMask = async (payload: { axios: any, uuids: string[] }) => {
    await payload.axios.delete('/api/v1/map_masks', {
      data: merge(getRoomBaseParams(args), { uuids: payload.uuids }),
    })
  }
  const updateMapMask = async (payload: Pick<MapMask, typeof sendParams[number]> & { axios: any, map_mask_uuid: string }) => {
    await payload.axios.patch(`/api/v1/map_masks/${payload.map_mask_uuid}`, merge(getRoomBaseParams(args), {
      api_v1_map_mask: pick(payload, ...sendParams),
    }))
  }
  return {
    addMapMask,
    addMapMasks,
    updateMapMask,
    deleteMapMask,
  }
}
