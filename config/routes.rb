Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
  namespace :api do
    mount ActionCable.server => '/cable'
    namespace :v1 do
      post "rooms/:room_uuid/login", to: "rooms#login", as: "rooms_login"
      post "rooms/:room_uuid/token/:room_token/check", to: "rooms#check_token", as: "rooms_check_token"
      get "rooms/:room_uuid", to: "rooms#detail", as: "rooms_detail"
      resources :rooms
      post "users/:user_uuid/login", to: "users#login", as: "users_verify"
      post "users/:user_uuid/token/:user_token/check", to: "users#check_token", as: "users_verify_token"
      get "users/:user_uuid", to: "users#detail", as: "users_detail"
      resources :users
      resources :tokens
    end
  end
end
