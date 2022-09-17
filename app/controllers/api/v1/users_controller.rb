# frozen_string_literal: true

module Api
  module V1
    class UsersController < HasTokenController
      # GET /api/v1/users or /api/v1/users.json
      def index
        @api_v1_users = params[:room_uuid].nil? ? Api::V1::User.all : Api::V1::User.where(room_uuid: params[:room_uuid])

        respond_to do |format|
          format.html { render :index }
          format.json { render json: @api_v1_users.map(&:to_response) }
        end
      end

      # POST /api/v1/users
      def create
        return if get_room(params[:api_v1_user][:room_uuid], params[:room_token]).nil?

        api_v1_user = Api::V1::User.new(api_v1_user_params_for_create)
        render json: api_v1_user.errors and return unless api_v1_user.save

        token = Api::V1::Token.create_by_user(api_v1_user).token
        render json: { verify: 'success', user_token: token, user: api_v1_user.to_response }
      end

      # PATCH /api/v1/users/1
      def update
        return if (api_v1_user = get_room_user(params)).nil?

        api_v1_user_params_for_update = params.require(:api_v1_user).permit(:name, :user_type, :last_logged_in)
        render json: api_v1_user.update(api_v1_user_params_for_update) ? { verify: 'success' } : api_v1_user.errors
      end

      # POST /api/v1/users/1/verify
      def login
        return if (api_v1_user = check_login(params)).nil?

        other_params = params.permit(:room_uuid, :user_uuid).slice(:room_uuid, :user_uuid)
        api_v1_token = Api::V1::Token.create(target_type: 'user', **other_params)
        api_v1_user.update(last_logged_in: DateTime.now)
        render json: { verify: 'success', user_token: api_v1_token.token }
      end

      # POST /api/v1/token/verify/users
      def check_token
        return if (base = check_check_token(params)).nil?

        render json: base.merge(verify: 'success')
      end

      # DELETE /api/v1/users/1
      def destroy
        return if (api_v1_user = get_room_user(params)).nil?

        api_v1_user.destroy
        render json: { verify: 'success' }
      end

      private

      def api_v1_user_params_for_create
        params.require(:api_v1_user).permit(:uuid, :name, :user_type, :password, :room_uuid, :last_logged_in)
      end

      def check_check_token(params)
        return nil if (api_v1_room = get_room(params[:room_uuid], params[:room_token])).nil?

        users = Api::V1::User.where(room_uuid: params[:room_uuid]).map(&:to_response)
        base = { room: api_v1_room.to_response, users: users }
        get_user(params, base).nil? ? nil : base
      end

      def check_login(params)
        check = get_room(params[:room_uuid], params[:room_token]).nil?
        check ||= (api_v1_user = check_no_such_user(params[:room_uuid], params[:user_uuid])).nil?
        check ||= check_user_invalid_password(api_v1_user, params[:password])
        check ? nil : api_v1_user
      end

      def check_user_invalid_password(api_v1_user, password)
        check = !BCrypt::Password.new(api_v1_user.password).is_password?(password)
        render json: { verify: 'failed', reason: 'invalid_password' } if check
        check
      end
    end
  end
end
