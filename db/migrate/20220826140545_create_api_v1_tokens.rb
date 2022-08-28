class CreateApiV1Tokens < ActiveRecord::Migration[7.0]
  def change
    create_table :api_v1_tokens do |t|
      t.string :target_type
      t.string :room_uuid
      t.string :user_uuid
      t.string :token

      t.timestamps
    end
  end
end
