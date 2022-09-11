# frozen_string_literal: true

class AddRoomUuidToApiV1Users < ActiveRecord::Migration[7.0]
  def up
    add_column :api_v1_users, :room_uuid, :string, after: :password
  end

  def down
    remove_column :api_v1_users, :room_uuid, :string
  end
end
