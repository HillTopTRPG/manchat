# frozen_string_literal: true

class Api
  class V1
    class Room < ApplicationRecord
      before_create lambda {
        self.uuid           = SecureRandom.uuid
        self.password       = BCrypt::Password.create(password)
        self.last_logged_in = DateTime.now
      }

      after_create lambda {
        ActionCable.server.broadcast(
          'rooms',
          {
            type: 'create-data',
            table: self.class.table_name,
            data: attributes.reject { |key| key == 'password' }
          }
        )
      }
      after_update lambda {
        ActionCable.server.broadcast('rooms',
                                     { type: 'update-data', table: self.class.table_name, uuid: uuid,
                                       data: previous_changes })
      }
      before_destroy lambda {
        Api::V1::Token.where(room_uuid: uuid).delete_all
        Api::V1::User.where(room_uuid: uuid).delete_all
      }
      after_destroy lambda {
        ActionCable.server.broadcast('rooms', { type: 'destroy-data', table: self.class.table_name, uuid: uuid })
      }
    end
  end
end
