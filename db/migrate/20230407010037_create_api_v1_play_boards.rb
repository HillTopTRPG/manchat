class CreateApiV1PlayBoards < ActiveRecord::Migration[7.0]
  def change
    create_table :api_v1_play_boards, id: false do |t|
      t.string :uuid, null: false, primary_key: true
      t.string :room_uuid, null: false, index: true
      t.string :name, null: false
      t.string :board_type, null: false
      t.integer :width, null: false
      t.integer :height, null: false
      t.string :screen_color, null: false
      t.string :bg_color, null: false
      t.string :border_color, null: false

      t.timestamps
    end
  end
end
