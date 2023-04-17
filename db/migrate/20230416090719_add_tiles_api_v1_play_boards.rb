class AddTilesApiV1PlayBoards < ActiveRecord::Migration[7.0]
  def up
    add_column :api_v1_play_boards, :tiles, :json, after: :border_color
  end

  def down
    remove_column :api_v1_play_boards, :tiles, :json
  end
end
