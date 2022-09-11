# frozen_string_literal: true

class UsersChannel < ApplicationCable::Channel
  def subscribed
    stream_from "user_#{params[:subscription_uuid]}"
    Api::V1::UsersChannelSubscriber.subscribed(params)
  end

  def unsubscribed
    Api::V1::UsersChannelSubscriber.unsubscribed(params)
  end

  def self.notify_connection_info(channel_name, message)
    ActionCable.server.broadcast(
      channel_name,
      { type: 'notify_connection_info', value: message }
    )
  end
end
