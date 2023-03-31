# frozen_string_literal: true

class UsersChannel < ApplicationCable::Channel
  def subscribed
    stream_from "user_#{params[:subscription_uuid]}"
    Api::V1::UsersChannelSubscriber.subscribed(params)
    user = Api::V1::User.find_by(room_uuid: params[:room_uuid], uuid: params[:user_uuid])
    unless user.nil?
      Api::V1::Chat.make_system_message(params[:room_uuid], "#{user.name || ''}が入室しました。")
    end
  end

  def unsubscribed
    Api::V1::UsersChannelSubscriber.unsubscribed(params)
    user = Api::V1::User.find_by(room_uuid: params[:room_uuid], uuid: params[:user_uuid])
    unless user.nil?
      Api::V1::Chat.make_system_message(params[:room_uuid], "#{user.name || ''}が退室しました。")
    end
  end

  def self.notify_connection_info(channel_name, message)
    ActionCable.server.broadcast(
      channel_name,
      { type: 'notify_connection_info', value: message }
    )
  end
end
