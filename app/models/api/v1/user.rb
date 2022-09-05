class Api::V1::User < Api::V1::SynchronizeRecord
  before_create -> {
    self.uuid           = SecureRandom.uuid
    self.password       = BCrypt::Password.create(self.password)
    self.last_logged_in = DateTime.now
    self.user_type      = Api::V1::User.exists?(:room_uuid => self.room_uuid) ? 'player' : 'master' if self.user_type.nil?
  }
  before_destroy -> {
    Api::V1::Token.where(:user_uuid => self.uuid).delete_all
  }
end
