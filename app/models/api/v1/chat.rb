# frozen_string_literal: true

module Api
  module V1
    class Chat < Api::V1::SynchronizeRecord
      validates :room_uuid, presence: true
      validates :raw, presence: true
      validates :secret, presence: true

      include UuidGenerator

      def to_response
        attributes
      end

      def self.make_system_message(room_uuid, raw)
        chat = new(room_uuid: room_uuid, tab: "system", raw: raw, secret: 0)
        unless chat.save
          puts chat.errors.full_messages
        end
      end
    end
  end
end
