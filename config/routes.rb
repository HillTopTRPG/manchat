Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
  namespace :api do
    mount ActionCable.server => '/cable'
    namespace :v1 do
      get "rooms", to: "rooms#index", as: "rooms"
      post "rooms", to: "rooms#create"
      get "rooms/:room_uuid", to: "rooms#detail", as: "room"
      patch "rooms/:room_uuid", to: "rooms#update"
      delete "rooms/:id", to: "rooms#destroy"
      post "rooms/:room_uuid/login", to: "rooms#login"
      post "rooms/:room_uuid/token/:room_token/check", to: "rooms#check_token"

      get "users", to: "users#index", as: "users"
      post "users", to: "users#create"
      get "users/:user_uuid", to: "users#detail", as: "user"
      patch "users/:user_uuid", to: "users#update"
      delete "users/:id", to: "users#destroy"
      post "users/:user_uuid/login", to: "users#login"
      # post "users/:user_uuid/logout", to: "users#logout"
      post "users/:user_uuid/token/:user_token/check", to: "users#check_token"

      get "tokens", to: "tokens#index", as: "tokens"
      delete "tokens/:id", to: "tokens#destroy"
    end
  end
end
