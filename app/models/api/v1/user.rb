class Api::V1::User < Api::V1::SynchronizeRecord
  before_create -> {
    self.uuid = SecureRandom.uuid
    self.password = BCrypt::Password.create(self.password)
    self.last_logged_in = DateTime.now
  }
  before_destroy -> {
    Api::V1::Token.where(:user_uuid => self.uuid).delete_all
  }
end
