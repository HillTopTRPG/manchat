# frozen_string_literal: true

module Api
  module V1
    class MapLinesController < AbstractRoomCollectionsController
      def model
        Api::V1::MapLine
      end

      # POST /api/v1/map_lines
      def make_create_data
        data = super
        data.owner_user = params[:user_uuid]
        data
      end

      def params_for_create
        params.require(:api_v1_map_line).permit(:play_board_uuid, :x1, :y1, :x2, :y2, :color)
      end

      def params_for_update
        params.require(:api_v1_map_line).permit(:play_board_uuid, :x1, :y1, :x2, :y2, :color)
      end
    end
  end
end
