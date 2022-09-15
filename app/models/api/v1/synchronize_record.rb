# frozen_string_literal: true

module Api
  module V1
    class SynchronizeRecord < ApplicationRecord
      self.abstract_class = true

      after_create lambda {
        ActionCable.server.broadcast(
          "room_#{room_uuid}",
          {
            type: 'create-data',
            table: self.class.table_name,
            data: to_response
          }
        )
      }
      after_update lambda {
        ActionCable.server.broadcast(
          "room_#{room_uuid}",
          {
            type: 'update-data',
            table: self.class.table_name,
            data: to_response,
            changes: previous_changes
          }
        )
      }
      after_destroy lambda {
        ActionCable.server.broadcast(
          "room_#{room_uuid}",
          {
            type: 'destroy-data',
            table: self.class.table_name,
            uuid: uuid
          }
        )
      }
    end
  end
end
