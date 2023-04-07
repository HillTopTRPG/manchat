module Api
  module V1
    class MapMask < Api::V1::SynchronizeRecord
      validates :room_uuid, presence: true
      validates :play_board_uuid, presence: true
      validates :grid_x, presence: true
      validates :grid_y, presence: true
      validates :bg_color, presence: true

      include UuidGenerator

      def to_response
        attributes
      end
    end
  end
end
