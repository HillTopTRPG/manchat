# frozen_string_literal: true

module UuidGenerator
  def self.included(klass)
    klass.before_create :fill_uuid
  end

  def fill_uuid
    self.uuid = loop do
      uuid = SecureRandom.uuid
      break uuid unless self.class.exists?(uuid: uuid)
    end
  end
end
