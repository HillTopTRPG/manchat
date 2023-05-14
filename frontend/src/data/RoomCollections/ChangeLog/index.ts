export type ChangeLog = {
  uuid: string
  room_uuid: string
  table: string
  owner_user: string
  before: any
  after: any
  created_at: Date
  updated_at: Date
}

export function createChangeLogFunctions() {
  return {}
}
