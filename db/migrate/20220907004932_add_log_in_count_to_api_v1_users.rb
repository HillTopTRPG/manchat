# frozen_string_literal: true

class AddLogInCountToApiV1Users < ActiveRecord::Migration[7.0]
  def up
    add_column :api_v1_users, :log_in_count, :integer, after: :room_uuid
  end

  def down
    remove_column :api_v1_users, :log_in_count, :integer
  end
end
