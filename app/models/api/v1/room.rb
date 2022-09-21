# frozen_string_literal: true

module Api
  module V1
    class Room < ApplicationRecord
      before_create lambda {
        self.uuid = SecureRandom.uuid
        self.password = BCrypt::Password.create(password)
        self.last_logged_in = DateTime.now
      }

      after_create lambda {
        ActionCable.server.broadcast(
          'rooms',
          {
            type: 'create-data',
            table: self.class.table_name,
            data: to_response
          }
        )
      }
      after_update lambda {
        ActionCable.server.broadcast(
          'rooms',
          { type: 'update-data', table: self.class.table_name, data: to_response, changes: previous_changes }
        )
        ActionCable.server.broadcast(
          "room_#{uuid}",
          { type: 'update-data', table: self.class.table_name, data: to_response, changes: previous_changes }
        )
      }
      after_destroy lambda {
        ActionCable.server.broadcast('rooms', { type: 'destroy-data', table: self.class.table_name, uuid: uuid })
        ActionCable.server.broadcast("room_#{uuid}", { type: 'destroy-data', table: self.class.table_name })
        Api::V1::Token.where(room_uuid: uuid).delete_all
        Api::V1::User.where(room_uuid: uuid).delete_all
      }

      def to_response
        attributes.except 'password'
      end
    end
  end
end
