# frozen_string_literal: true

module Api
  module V1
    class RoomsController < ApplicationController
      before_action :set_api_v1_room, only: %i[update destroy]

      # GET /api/v1/rooms or /api/v1/rooms.json
      def index
        @api_v1_rooms = Api::V1::Room.all

        respond_to do |format|
          format.html { render :index }
          format.json { render json: @api_v1_rooms.map(&:to_response) }
        end
      end

      # GET /api/v1/rooms/:room_uuid
      def detail
        api_v1_room = Api::V1::Room.find_by(uuid: params[:room_uuid])
        if api_v1_room.nil?
          render json: nil
        else
          render json: api_v1_room.to_response
        end
      end

      # POST /api/v1/rooms
      def create
        api_v1_room = Api::V1::Room.new(api_v1_room_params)
        if api_v1_room.save
          api_v1_token = Api::V1::Token.new(target_type: 'room', room_uuid: api_v1_room.uuid)
          api_v1_token.save
          render json: { success: true, room_token: api_v1_token.token, room: api_v1_room.to_response }
        else
          render json: api_v1_room.errors
        end
      end

      # PATCH/PUT /api/v1/rooms/1 or /api/v1/rooms/1.json
      def update
        respond_to do |format|
          if @api_v1_room.update(api_v1_room_params)
            format.html { redirect_to api_v1_rooms_path, notice: 'Room was successfully updated.' }
            format.json { render :show, status: :ok, location: @api_v1_room }
          else
            format.html { render :edit, status: :unprocessable_entity }
            format.json { render json: @api_v1_room.errors, status: :unprocessable_entity }
          end
        end
      end

      # POST api/v1/rooms/:room_uuid/login
      def login
        return if (api_v1_room = check_no_such_room(params[:room_uuid])).nil? ||
                  check_room_invalid_password(api_v1_room, params[:password])

        render json: {
          verify: 'success',
          room_token: Api::V1::Token.create(target_type: 'room', room_uuid: params[:room_uuid]).token,
          users: Api::V1::User.where(room_uuid: params[:room_uuid]).map(&:to_response)
        }
      end

      # POST api/v1/rooms/:room_uuid/token/:room_token/check
      def check_token
        return if (api_v1_room = check_no_such_room(params[:room_uuid])).nil? ||
                  check_expire_room_token(params[:room_uuid], params[:room_token])

        # noinspection RubyNilAnalysis
        render json: {
          verify: 'success',
          room: api_v1_room.to_response,
          users: Api::V1::User.where(room_uuid: params[:room_uuid]).map(&:to_response)
        }
      end

      # DELETE /api/v1/rooms/1 or /api/v1/rooms/1.json
      def destroy
        @api_v1_room.destroy

        respond_to do |format|
          format.html { redirect_to api_v1_rooms_url, notice: 'Room was successfully destroyed.' }
          format.json { head :no_content }
        end
      end

      private

      # Use callbacks to share common setup or constraints between actions.
      def set_api_v1_room
        @api_v1_room = Api::V1::Room.find(params[:id])
      end

      # Only allow a list of trusted parameters through.
      def api_v1_room_params
        params.require(:api_v1_room).permit(:uuid, :name, :password, :last_logged_in)
      end

      def check_no_such_room(room_uuid, base = {})
        if (api_v1_room = Api::V1::Room.find_by(uuid: room_uuid)).nil?
          render json: { **base, verify: 'failed', reason: 'no_such_room' } and return nil
        end

        api_v1_room
      end

      def check_room_invalid_password(api_v1_room, password)
        unless BCrypt::Password.new(api_v1_room.password).is_password?(password)
          render json: { verify: 'failed', reason: 'invalid_password' } and return true
        end

        false
      end

      def check_expire_room_token(room_uuid, room_token, base = {})
        unless Api::V1::Token.valid.check_room(room_uuid, room_token)
          render json: { **base, verify: 'failed', reason: 'expire_room_token' } and return true
        end

        false
      end
    end
  end
end
