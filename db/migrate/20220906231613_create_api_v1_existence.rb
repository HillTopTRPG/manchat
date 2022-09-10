class CreateApiV1Existence < ActiveRecord::Migration[7.0]
  def change
    create_table :api_v1_users_channel_subscribers do |t|
      t.string :subscription_uuid
      t.string :room_uuid
      t.string :room_token
      t.string :user_uuid
      t.string :user_token

      t.timestamps
    end
  end
end
