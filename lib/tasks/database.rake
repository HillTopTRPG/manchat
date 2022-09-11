# frozen_string_literal: true

namespace :database do
  desc '起動時にテーブルのデータを初期化する'
  task initialize: :environment do
    Api::V1::UsersChannelSubscriber.delete_all
  end
end
