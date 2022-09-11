# frozen_string_literal: true

json.array! @api_v1_users, partial: 'api_v1_users/api_v1_user', as: :api_v1_user
