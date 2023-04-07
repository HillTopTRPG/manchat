# frozen_string_literal: true

Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
  namespace :api do
    mount ActionCable.server => '/cable'
    namespace :v1 do
      %w[room user].each do |n|
        get "#{n}s", to: "#{n}s#index", as: "#{n}s"
        post "#{n}s", to: "#{n}s#create"
        patch "#{n}s/:#{n}_uuid", to: "#{n}s#update"
        delete "#{n}s/:#{n}_uuid", to: "#{n}s#destroy"
        post "#{n}s/:#{n}_uuid/login", to: "#{n}s#login"
        post "#{n}s/:#{n}_uuid/token/:#{n}_token/check", to: "#{n}s#check_token"
      end

      get 'room_collections/:room_uuid', to: 'room_collections#index', as: 'room_collections'

      %w[chats map_mask play_board].each do |n|
        get n, to: "#{n}#index", as: n
        post n, to: "#{n}#create"
        patch "#{n}/:uuid", to: "#{n}#update"
        delete "#{n}/:uuid", to: "#{n}#destroy"
      end

      %w[change_logs].each do |n|
        get n, to: "#{n}#index", as: n
      end
    end
  end
end
