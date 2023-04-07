class CreateApiV1MapMasks < ActiveRecord::Migration[7.0]
  def change
    create_table :api_v1_map_masks, id: false do |t|
      t.string :uuid, null: false, primary_key: true
      t.string :room_uuid, null: false, index: true
      t.string :play_board_uuid, null: false, index: true
      t.string :owner_user
      t.integer :grid_x, null: false
      t.integer :grid_y, null: false
      t.string :bg_color, null: false

      t.timestamps
    end
  end
end
