# frozen_string_literal: true

module Api
  module V1
    class ChangeLog < Api::V1::SynchronizeRecord
      validates :uuid, presence: true, uniqueness: true
      validates :room_uuid, presence: true
      validates :room_uuid, presence: true
      validates :table, presence: true
      validates :owner_user, presence: true
      validates :before, presence: true
      validates :after, presence: true

      include UuidGenerator

      def to_response
        attributes
      end
    end
  end
end
