# frozen_string_literal: true

module Api
  module V1
    class RoomCollectionsController < ApplicationController
      # GET /api/v1/room_collections/:room_uuid
      def index
        render json: {
          users: Api::V1::User.for_client(params),
          chats: Api::V1::Chat.for_client(params),
          change_logs: Api::V1::ChangeLog.for_client(params),
          map_masks: Api::V1::MapMask.for_client(params),
          play_boards: Api::V1::PlayBoard.for_client(params),
          map_lines: Api::V1::MapLine.for_client(params)
        }
      end
    end
  end
end
