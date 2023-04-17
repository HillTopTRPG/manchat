# frozen_string_literal: true

module Api
  module V1
    class PlayBoardsController < AbstractRoomCollectionsController
      def model
        Api::V1::PlayBoard
      end

      def params_for_create
        [:room_uuid, :name, :board_type, :width, :height, :screen_color, :bg_color, :border_color, :tiles]
      end

      def params_for_update
        [:room_uuid, :name, :board_type, :width, :height, :screen_color, :bg_color, :border_color, :tiles]
      end
    end
  end
end
