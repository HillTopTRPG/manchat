# frozen_string_literal: true

module Api
  module V1
    class SynchronizeRecord < ApplicationRecord
      self.abstract_class = true

      scope :for_client, ->(params) { where(room_uuid: params[:room_uuid]).order(:created_at) }

      after_commit lambda {
        ActionCable.server.broadcast(
          "room_#{room_uuid}",
          {
            type: 'create-data',
            table: self.class.table_name,
            dataList: [to_response]
          }
        )
      }, on: :create

      after_commit lambda {
        ActionCable.server.broadcast(
          "room_#{room_uuid}",
          {
            type: 'update-data',
            table: self.class.table_name,
            dataList: [to_response],
            changes: previous_changes
          }
        )
      }, on: :update

      after_commit lambda {
        ActionCable.server.broadcast(
          "room_#{room_uuid}",
          {
            type: 'destroy-data',
            table: self.class.table_name,
            uuids: [uuid]
          }
        )
      }, on: :destroy
    end
  end
end
