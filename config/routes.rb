Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"
  namespace :api do
    namespace :v1 do
      resources :users
      post "users/:id/verify", to: "users#verify", as: "verify"
    end
  end

  root "api/v1/users#index"
end
