# frozen_string_literal: true

module Api
  module V1
    class ChangeLog < Api::V1::SynchronizeRecord
      include UuidGenerator
    end
  end
end
