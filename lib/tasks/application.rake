# frozen_string_literal: true

namespace :application do
  desc 'アプリケーションの初期設定'
  task :initialize do
    puts "--------------------------\nInitialization starting...\n--------------------------"
    system("bundle install -j4")
    Rake::Task["db:create"].invoke
    Rake::Task["db:migrate"].invoke
    Rake::Task["app:update:bin"].invoke
    Rake::Task["database:initialize"].invoke
    puts "------------------------------------\nInitialization have been completed!!\n------------------------------------"
  end
end
