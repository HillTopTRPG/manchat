class AddUserTypeToApiV1Users < ActiveRecord::Migration[7.0]
  def up
    add_column :api_v1_users, :user_type, :string, after: :name

    execute <<-SQL
      UPDATE api_v1_users SET user_type='player'
    SQL
  end

  def down
    execute <<-SQL
      UPDATE api_v1_users SET user_type=null
    SQL
    remove_column :api_v1_users, :user_type, :string
  end
end
