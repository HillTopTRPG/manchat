json.extract! api_v1_user, :id, :uuid, :name, :password, :last_logged_in, :created_at, :updated_at
json.url api_v1_user_url(api_v1_user, format: :json)
