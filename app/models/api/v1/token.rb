class Api::V1::Token < ApplicationRecord
  before_create -> {
    self.token = SecureRandom.uuid
  }

  def self.valid
    where("updated_at > ?", Time.zone.now.ago(Settings.token.ttl.second))
  end

  def self.room(room_token)
    where(:target_type => "room", :token => room_token)
  end

  def self.user(user_token)
    where(:target_type => "user", :token => user_token)
  end
end
