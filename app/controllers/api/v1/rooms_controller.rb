# frozen_string_literal: true

module Api
  module V1
    class RoomsController < HasTokenController
      # GET /api/v1/rooms or /api/v1/rooms.json
      def index
        @api_v1_rooms = Api::V1::Room.all

        respond_to do |format|
          format.html { render :index }
          format.json { render json: @api_v1_rooms.map(&:to_response) }
        end
      end

      # POST /api/v1/rooms
      def create
        api_v1_room = Api::V1::Room.new(api_v1_room_params)
        if api_v1_room.save
          api_v1_token = Api::V1::Token.create(target_type: 'room', room_uuid: api_v1_room.uuid)
          render json: { success: true, room_token: api_v1_token.token, room: api_v1_room.to_response }
        else
          render json: api_v1_room.errors
        end
      end

      # PATCH /api/v1/rooms/1
      def update
        return if (api_v1_room = check_update(params)).nil?

        api_v1_room_params_for_update = params.require(:api_v1_room).permit(:name)
        render json: api_v1_room.update(api_v1_room_params_for_update) ? { verify: 'success' } : api_v1_room.errors
      end

      # POST api/v1/rooms/:room_uuid/login
      def login
        return if (api_v1_room = check_no_such_room(params[:room_uuid])).nil?
        return if check_room_invalid_password(api_v1_room, params[:password])

        room_token = Api::V1::Token.create(target_type: 'room', room_uuid: params[:room_uuid]).token
        users = Api::V1::User.where(room_uuid: params[:room_uuid]).map(&:to_response)
        render json: { verify: 'success', room_token: room_token, users: users }
      end

      # POST api/v1/rooms/:room_uuid/token/:room_token/check
      def check_token
        return if (api_v1_room = get_room(params[:room_uuid], params[:room_token])).nil?

        room = api_v1_room.to_response
        # noinspection RubyNilAnalysis
        users = Api::V1::User.where(room_uuid: params[:room_uuid]).map(&:to_response)
        render json: { verify: 'success', room: room, users: users }
      end

      # DELETE /api/v1/rooms/1
      def destroy
        return if (api_v1_room = check_destroy(params)).nil?

        api_v1_room.destroy
        render json: { verify: 'success' }
      end

      private

      # Only allow a list of trusted parameters through.
      def api_v1_room_params
        params.require(:api_v1_room).permit(:uuid, :name, :password, :last_logged_in)
      end

      def check_update(params)
        return nil if (api_v1_room = get_room(params[:room_uuid], params[:room_token])).nil?
        return nil if (api_v1_user = get_user(params)).nil?
        return api_v1_room if api_v1_user.user_type == 'master'

        render json: { verify: 'failed', reason: 'unauthorized_operations' }
        nil
      end

      def check_destroy(params)
        return nil if (api_v1_room = get_room(params[:room_uuid], params[:room_token])).nil?
        return api_v1_room if Api::V1::User.where(room_uuid: params[:room_uuid]).count.zero?
        return nil if (api_v1_user = get_user(params)).nil?
        return api_v1_room if api_v1_user.user_type == 'master'

        render json: { verify: 'failed', reason: 'unauthorized_operations' }
        nil
      end

      def check_room_invalid_password(api_v1_room, password)
        check = !BCrypt::Password.new(api_v1_room.password).is_password?(password)
        render json: { verify: 'failed', reason: 'invalid_password' } if check
        check
      end
    end
  end
end
