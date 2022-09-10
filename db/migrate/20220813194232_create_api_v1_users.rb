# frozen_string_literal: true

class CreateApiV1Users < ActiveRecord::Migration[7.0]
  def change
    create_table :api_v1_users do |t|
      t.string :uuid
      t.string :name
      t.string :password
      t.datetime :last_logged_in

      t.timestamps
    end
  end
end
