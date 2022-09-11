# frozen_string_literal: true

namespace :token do
  desc 'ユーザーチャンネルのサブスクライバーのトークンの有効期限を延長する'
  task ttl_extension: :environment do
    Api::V1::UsersChannelSubscriber.all.each do |subscription|
      channel_name = "user_#{subscription.subscription_uuid}"

      api_v1_room = Api::V1::Room.find_by(uuid: subscription.room_uuid)
      return UsersChannel.notify_connection_info(channel_name, 'room-deleted') if api_v1_room.nil?

      api_v1_user = Api::V1::User.find_by(uuid: subscription.user_uuid, room_uuid: api_v1_room.uuid)
      return UsersChannel.notify_connection_info(channel_name, 'user-deleted') if api_v1_user.nil?

      api_v1_token_room = Api::V1::Token.find_by(
        target_type: 'room',
        room_uuid: api_v1_room.uuid,
        token: subscription.room_token
      )
      return UsersChannel.notify_connection_info(channel_name, 'invalid-room-token') if api_v1_token_room.nil?

      api_v1_token_user = Api::V1::Token.find_by(
        target_type: 'user',
        room_uuid: api_v1_room.uuid,
        user_uuid: api_v1_user.uuid,
        token: subscription.user_token
      )
      return UsersChannel.notify_connection_info(channel_name, 'invalid-user-token') if api_v1_token_user.nil?

      # トークンの有効期限を延長する
      api_v1_token_room.touch
      api_v1_token_user.touch
    end
  end

  desc '有効期限切れのトークン情報を削除する'
  task delete_expired: :environment do
    Api::V1::Token.expired.delete_all
  end
end
