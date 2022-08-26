Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
  namespace :api do
    mount ActionCable.server => '/cable'
    namespace :v1 do
      resources :users
      post "users/:id/verify", to: "users#verify", as: "users_verify"
      resources :rooms
      post "rooms/:id/verify", to: "rooms#verify", as: "rooms_verify"
    end
  end
end
