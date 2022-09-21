# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.0].define(version: 2022_09_21_050001) do
  create_table "api_v1_change_logs", primary_key: "uuid", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "room_uuid", null: false
    t.string "table", null: false
    t.string "owner_user", null: false
    t.json "before", null: false
    t.json "after", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "api_v1_chats", primary_key: "uuid", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "room_uuid", null: false
    t.string "tab"
    t.text "raw", null: false
    t.string "owner_user"
    t.string "owner_character"
    t.string "target"
    t.integer "secret", null: false
    t.json "rands"
    t.json "reactions"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "api_v1_rooms", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "uuid"
    t.string "name"
    t.string "password"
    t.datetime "last_logged_in"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "api_v1_tokens", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "target_type"
    t.string "room_uuid"
    t.string "user_uuid"
    t.string "token"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "api_v1_users", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "uuid"
    t.string "name"
    t.string "user_type"
    t.string "password"
    t.string "room_uuid"
    t.integer "log_in_count"
    t.datetime "last_logged_in"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "api_v1_users_channel_subscribers", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "subscription_uuid"
    t.string "room_uuid"
    t.string "room_token"
    t.string "user_uuid"
    t.string "user_token"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

end
