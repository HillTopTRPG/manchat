# frozen_string_literal: true

module Api
  module V1
    class RoomCollectionsController < ApplicationController
      # GET /api/v1/room_collections/:room_uuid
      def index
        users = Api::V1::User.where(room_uuid: params[:room_uuid]).order(:created_at)
        chats = Api::V1::Chat.where(room_uuid: params[:room_uuid]).order(:created_at)
        change_logs = Api::V1::ChangeLog.where(room_uuid: params[:room_uuid]).order(:created_at)
        map_masks = Api::V1::MapMask.where(room_uuid: params[:room_uuid]).order(:created_at)
        play_boards = Api::V1::PlayBoard.where(room_uuid: params[:room_uuid]).order(:created_at)
        map_lines = Api::V1::MapLine.where(room_uuid: params[:room_uuid]).order(:created_at)
        render json: {
          users: users,
          chats: chats,
          change_logs: change_logs,
          map_masks: map_masks,
          play_boards: play_boards,
          map_lines: map_lines
        }
      end
    end
  end
end
