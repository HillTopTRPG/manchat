# frozen_string_literal: true

module Api
  module V1
    class UsersChannelSubscriber < ApplicationRecord
      def self.subscribed(params)
        create(**params.slice(:subscription_uuid, :room_uuid, :room_token, :user_uuid, :user_token))
        update_user(params)
      end

      def self.unsubscribed(params)
        find_by(**params.slice(:subscription_uuid, :room_uuid, :user_uuid)).destroy
        update_user(params)
      end

      def self.update_user(params)
        log_in_count = where(**params.slice(:room_uuid, :user_uuid)).group_by(&:subscription_uuid).count
        api_v1_user  = Api::V1::User.find_by(**params.slice(:room_uuid), uuid: params[:user_uuid])
        api_v1_user.update(log_in_count: log_in_count) if api_v1_user.log_in_count != log_in_count
      end
    end
  end
end
