# frozen_string_literal: true

module Api
  module V1
    class User < Api::V1::SynchronizeRecord
      include UuidGenerator

      before_create lambda {
        self.password = BCrypt::Password.create(password)
        self.last_logged_in = DateTime.now
        self.user_type = Api::V1::User.exists?(room_uuid: room_uuid) ? 'player' : 'master' if user_type.nil?
      }

      after_commit lambda {
        Api::V1::Token.where(user_uuid: uuid).delete_all
        Api::V1::UsersChannelSubscriber.where(user_uuid: uuid).delete_all
        Api::V1::Chat.where(owner_user: uuid).delete_all
        Api::V1::ChangeLog.where(owner_user: uuid).delete_all
        if self.user_type == "master"
          users = Api::V1::User.where(room_uuid: room_uuid)
          if users.count > 0
            user = users.take
            user.user_type = "master"
            user.save
          end
        end
      }, on: :destroy

      def to_response
        attributes.except 'password'
      end
    end
  end
end
