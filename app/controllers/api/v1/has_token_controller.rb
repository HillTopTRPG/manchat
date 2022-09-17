# frozen_string_literal: true

module Api
  module V1
    class HasTokenController < ApplicationController
      def get_room(room_uuid, room_token)
        check = (api_v1_room = check_no_such_room(room_uuid)).nil?
        check ||= check_expire_room_token(room_uuid, room_token)
        check ? nil : api_v1_room
      end

      def check_no_such_room(room_uuid, base = {})
        check = (api_v1_room = Api::V1::Room.find_by(uuid: room_uuid)).nil?
        render json: base.merge(verify: 'failed', reason: 'no_such_room') if check
        check ? nil : api_v1_room
      end

      def check_expire_room_token(room_uuid, room_token, base = {})
        check = !Api::V1::Token.valid.check_room(room_uuid, room_token)
        render json: base.merge(verify: 'failed', reason: 'expire_room_token') if check
        check
      end

      def get_user(params, base = {})
        check = (api_v1_user = check_no_such_user(params[:room_uuid], params[:user_uuid], base)).nil?
        check ||= check_expire_user_token(params[:room_uuid], params[:user_uuid], params[:user_token], base)
        check ? nil : api_v1_user
      end

      def check_no_such_user(room_uuid, user_uuid, base = {})
        check = (api_v1_user = Api::V1::User.find_by(uuid: user_uuid, room_uuid: room_uuid)).nil?
        render json: base.merge(verify: 'failed', reason: 'no_such_user') if check
        check ? nil : api_v1_user
      end

      def check_expire_user_token(room_uuid, user_uuid, user_token, base = {})
        check = !Api::V1::Token.valid.check_user(room_uuid, user_uuid, user_token)
        render json: base.merge(verify: 'failed', reason: 'expire_user_token') if check
        check
      end

      def get_room_user(params)
        return nil if get_room(params[:room_uuid], params[:room_token]).nil?

        get_user(params)
      end
    end
  end
end
