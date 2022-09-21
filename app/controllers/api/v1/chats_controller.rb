# frozen_string_literal: true

module Api
  module V1
    class ChatsController < RoomCollectionsController
      def model
        Api::V1::Chat
      end

      def params_for_create
        params.require(:api_v1_chat).permit(:room_uuid, :tab, :raw, :owner_user, :owner_character, :target, :secret,
                                            :rands, :reactions)
      end

      def params_for_update
        params.require(:api_v1_chat).permit(:tab, :raw, :target, :secret, :reactions)
      end
    end
  end
end
