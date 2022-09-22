# frozen_string_literal: true

module Api
  module V1
    class Chat < Api::V1::SynchronizeRecord
      validates :uuid, presence: true, uniqueness: true
      validates :room_uuid, presence: true
      validates :raw, presence: true
      validates :secret, presence: true

      include UuidGenerator

      def to_response
        attributes
      end
    end
  end
end
