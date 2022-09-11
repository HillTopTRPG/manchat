# frozen_string_literal: true

json.array! @api_v1_rooms, partial: 'api_v1_rooms/api_v1_room', as: :api_v1_room
