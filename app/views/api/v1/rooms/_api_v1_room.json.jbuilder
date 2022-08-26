json.extract! api_v1_room, :id, :uuid, :name, :password, :last_logged_in, :created_at, :updated_at
json.url api_v1_room_url(api_v1_room, format: :json)
