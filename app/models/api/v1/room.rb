class Api::V1::Room < ApplicationRecord
  before_create -> {
    self.uuid = SecureRandom.uuid
    self.password = BCrypt::Password.create(self.password)
    self.last_logged_in = DateTime.now
  }

  after_create -> {
    ActionCable.server.broadcast("rooms", { type: "create-data", table: self.class.table_name, data: self })
  }
  after_update -> {
    ActionCable.server.broadcast("rooms", { type: "update-data", table: self.class.table_name, id: self.id, data: self.previous_changes })
  }
  before_destroy -> {
    Api::V1::Token.where(:room_uuid => self.uuid).delete_all
    Api::V1::User.where(:room_uuid => self.uuid).delete_all
  }
  after_destroy -> {
    ActionCable.server.broadcast("rooms", { type: "destroy-data", table: self.class.table_name, id: self.id })
  }
end
