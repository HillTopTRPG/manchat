class CreateApiV1MapLines < ActiveRecord::Migration[7.0]
  def change
    create_table :api_v1_map_lines, id: false do |t|
      t.string :uuid, null: false, primary_key: true
      t.string :room_uuid, null: false, index: true
      t.string :play_board_uuid, null: false, index: true
      t.string :owner_user
      t.float :x1, null: false
      t.float :y1, null: false
      t.float :x2, null: false
      t.float :y2, null: false
      t.string :color, null: false

      t.timestamps
    end
  end
end
