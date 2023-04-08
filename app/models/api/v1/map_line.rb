# frozen_string_literal: true

module Api
  module V1
    class MapLine < Api::V1::SynchronizeRecord
      validates :room_uuid, presence: true
      validates :play_board_uuid, presence: true
      validates :x1, presence: true
      validates :y1, presence: true
      validates :x2, presence: true
      validates :y2, presence: true
      validates :color, presence: true

      include UuidGenerator

      def to_response
        attributes
      end
    end
  end
end
