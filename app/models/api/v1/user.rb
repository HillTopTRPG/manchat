class Api::V1::User < ApplicationRecord
  before_create -> {
    self.uuid = SecureRandom.uuid
    self.password = BCrypt::Password.create(self.password)
    self.last_logged_in = DateTime.now
  }
end
