# frozen_string_literal: true

module Api
  module V1
    class ChatsController < AbstractRoomCollectionsController
      def model
        Api::V1::Chat
      end

      # POST /api/v1/chats
      def make_create_data
        data = super
        data.owner_user = params[:user_uuid]
        data
      end

      def params_for_create
        params.require(:api_v1_chat).permit(:tab, :raw, :owner_character, :target_type, :target_uuid, :secret)
      end

      def params_for_update
        params.require(:api_v1_chat).permit(:tab, :raw, :owner_character, :target_type, :target_uuid, :secret)
      end
    end
  end
end
