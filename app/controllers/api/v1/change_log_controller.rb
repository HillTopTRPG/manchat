# frozen_string_literal: true

module Api
  module V1
    class ChangeLogController < AbstractRoomCollectionsController
      def model
        Api::V1::ChangeLog
      end
    end
  end
end
