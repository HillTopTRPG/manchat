# frozen_string_literal: true

class RoomsChannel < ApplicationCable::Channel
  def subscribed
    # stream_from "some_channel"
    stream_from 'rooms'
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
