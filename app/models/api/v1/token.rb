# frozen_string_literal: true

module Api
  module V1
    class Token < ApplicationRecord
      before_create lambda {
        self.token = SecureRandom.uuid
      }

      def self.expired
        where('updated_at <= ?', Time.zone.now.ago(Settings.token.ttl.second))
      end

      def self.valid
        where('updated_at > ?', Time.zone.now.ago(Settings.token.ttl.second))
      end

      def self.check_room(room_uuid, room_token)
        exists?(target_type: 'room', room_uuid: room_uuid, token: room_token)
      end

      def self.check_user(room_uuid, user_uuid, user_token)
        exists?(target_type: 'user', room_uuid: room_uuid, user_uuid: user_uuid, token: user_token)
      end

      def self.create_by_user(api_v1_user)
        Api::V1::Token.create(
          target_type: 'user',
          **api_v1_user.slice(:room_uuid),
          user_uuid: api_v1_user.uuid
        )
      end
    end
  end
end
