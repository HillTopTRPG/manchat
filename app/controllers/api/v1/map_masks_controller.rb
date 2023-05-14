# frozen_string_literal: true

module Api
  module V1
    class MapMasksController < AbstractRoomCollectionsController
      def model
        Api::V1::MapMask
      end

      # POST /api/v1/map_masks
      def make_create_data data
        super data
        data[:owner_user] = params[:user_uuid]
        data
      end

      def params_for_create
        [:play_board_uuid, :grid_x, :grid_y, :bg_color]
      end

      def params_for_update
        [:play_board_uuid, :grid_x, :grid_y, :bg_color]
      end
    end
  end
end
