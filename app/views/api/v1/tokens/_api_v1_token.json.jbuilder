# frozen_string_literal: true

json.extract! api_v1_token, :id, :target_type, :target_uuid, :token, :created_at, :updated_at
json.url api_v1_token_url(api_v1_token, format: :json)
