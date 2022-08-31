class Api::V1::Token < ApplicationRecord
  before_create -> {
    self.token = SecureRandom.uuid
  }

  def self.valid
    where('updated_at > ?', Time.zone.now.ago(Settings.token.ttl.second))
  end

  def self.check_room(room_uuid, room_token)
    find_by(:target_type => 'room', :room_uuid => room_uuid, :token => room_token)
  end

  def self.check_user(room_uuid, user_uuid, user_token)
    find_by(:target_type => 'user', :room_uuid => room_uuid, :user_uuid => user_uuid, :token => user_token)
  end
end
