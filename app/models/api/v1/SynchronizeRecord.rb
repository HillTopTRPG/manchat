
class Api::V1::SynchronizeRecord < ApplicationRecord
  self.abstract_class = true

  after_create -> {
    ActionCable.server.broadcast("room_#{self.room_uuid}", { type: "create-data", table: self.class.table_name, data: self.attributes.reject {|key| key == 'password'} })
  }
  after_update -> {
    ActionCable.server.broadcast("room_#{self.room_uuid}", { type: "update-data", table: self.class.table_name, uuid: self.uuid, data: self.previous_changes })
  }
  after_destroy -> {
    ActionCable.server.broadcast("room_#{self.room_uuid}", { type: "destroy-data", table: self.class.table_name, uuid: self.uuid })
  }
end
