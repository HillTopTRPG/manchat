# frozen_string_literal: true

module Api
  module V1
    class PlayBoardsController < AbstractRoomCollectionsController
      def model
        Api::V1::PlayBoard
      end

      def params_for_create
        params.require(:api_v1_play_board).permit(:room_uuid, :name, :board_type, :width, :height, :screen_color,
                                                  :bg_color, :border_color)
      end

      def params_for_update
        params.require(:api_v1_play_board).permit(:room_uuid, :name, :board_type, :width, :height, :screen_color,
                                                  :bg_color, :border_color)
      end
    end
  end
end
