Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
  namespace :api do
    mount ActionCable.server => '/cable'
    namespace :v1 do
      resources :rooms
      post "rooms/:id/verify", to: "rooms#verify", as: "rooms_verify"
      post "token/verify/rooms", to: "rooms#verifyToken", as: "rooms_verify_token"
      get "rooms/u/:room_uuid", to: "rooms#detailByUUid", as: "rooms_detail_by_uuid"
      resources :users
      post "users/:id/verify", to: "users#verify", as: "users_verify"
      post "token/verify/users", to: "users#verifyToken", as: "users_verify_token"
      get "users/u/:user_uuid", to: "users#detailByUUid", as: "users_detail_by_uuid"
      resources :tokens
    end
  end
end
