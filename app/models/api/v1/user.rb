# frozen_string_literal: true

module Api
  module V1
    class User < Api::V1::SynchronizeRecord
      before_create lambda {
        self.uuid           = SecureRandom.uuid
        self.password       = BCrypt::Password.create(password)
        self.last_logged_in = DateTime.now
        self.user_type      = Api::V1::User.exists?(room_uuid: room_uuid) ? 'player' : 'master' if user_type.nil?
      }
      before_destroy lambda {
        Api::V1::Token.where(user_uuid: uuid).delete_all
      }

      def to_response
        attributes.except :password
      end
    end
  end
end
