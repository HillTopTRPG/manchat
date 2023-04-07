module Api
  module V1
    class MapMaskController < AbstractRoomCollectionsController
      def model
        Api::V1::MapMask
      end

      # POST /api/v1/chats
      def make_create_data
        data = super
        data.owner_user = params[:user_uuid]
        data
      end

      def params_for_create
        params.require(:api_v1_map_mask).permit(:play_board_uuid, :grid_x, :grid_y, :bg_color)
      end

      def params_for_update
        params.require(:api_v1_map_mask).permit(:play_board_uuid, :grid_x, :grid_y, :bg_color)
      end
    end
  end
end
