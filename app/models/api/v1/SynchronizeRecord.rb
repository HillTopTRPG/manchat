
class Api::V1::SynchronizeRecord < ApplicationRecord
  self.abstract_class = true

  after_create -> {
    ActionCable.server.broadcast("room_#{self.room_uuid}", { type: "create-data", table: self.class.table_name, data: self })
  }
  after_update -> {
    ActionCable.server.broadcast("room_#{self.room_uuid}", { type: "update-data", table: self.class.table_name, id: self.id, data: self.previous_changes })
  }
  after_destroy -> {
    ActionCable.server.broadcast("room_#{self.room_uuid}", { type: "destroy-data", table: self.class.table_name, id: self.id })
  }
end
