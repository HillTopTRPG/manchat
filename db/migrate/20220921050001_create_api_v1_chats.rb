# frozen_string_literal: true

class CreateApiV1Chats < ActiveRecord::Migration[7.0]
  def change
    create_table :api_v1_chats, id: false do |t|
      t.string :uuid, null: false, primary_key: true
      t.string :room_uuid, null: false, index: true
      t.string :tab
      t.text :raw, null: false
      t.string :owner_user
      t.string :owner_character
      t.string :target_type
      t.string :target_uuid
      t.integer :secret, null: false # 0: non secret, 1: secret(hide), 2: secret(opened)
      t.string :ref_uuid
      t.json :attached
      t.json :reactions # { "💐": { "user-uuid-1": 3, "user-uuid-2": 1 } }

      t.timestamps
    end

    create_table :api_v1_change_logs, id: false do |t|
      t.string :uuid, null: false, primary_key: true
      t.string :room_uuid, null: false, index: true
      t.string :table, null: false
      t.string :owner_user, null: false
      t.json :before, null: false
      t.json :after, null: false

      t.timestamps
    end
  end
end
