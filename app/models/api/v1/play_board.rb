module Api
  module V1
    class PlayBoard < Api::V1::SynchronizeRecord
      validates :room_uuid, presence: true
      validates :name, presence: true
      validates :board_type, presence: true
      validates :width, presence: true
      validates :height, presence: true
      validates :screen_color, presence: true
      validates :bg_color, presence: true
      validates :border_color, presence: true

      include UuidGenerator

      def to_response
        attributes
      end
    end
  end
end
