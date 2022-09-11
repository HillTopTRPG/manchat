# frozen_string_literal: true

class Api
  class V1
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
    end
  end
end
