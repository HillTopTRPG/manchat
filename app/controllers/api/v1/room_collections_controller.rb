# frozen_string_literal: true

module Api
  module V1
    class RoomCollectionsController < ApplicationController
      # GET /api/v1/room_collections/:room_uuid
      def index
        users = Api::V1::User.where(room_uuid: params[:room_uuid]).order(:created_at)
        chats = Api::V1::Chat.where(room_uuid: params[:room_uuid]).order(:created_at)
        change_logs = Api::V1::ChangeLog.where(room_uuid: params[:room_uuid]).order(:created_at)
        render json: {
          users: users,
          chats: chats,
          change_logs: change_logs
        }
      end
    end
  end
end
