# frozen_string_literal: true

class Api
  class V1
    class UsersController < ApplicationController
      before_action :set_api_v1_user, only: %i[destroy]

      # GET /api/v1/users or /api/v1/users.json
      def index
        @api_v1_users = []
        @api_v1_users = if params[:room_uuid].nil?
                          Api::V1::User.all
                        else
                          Api::V1::User.where(room_uuid: params[:room_uuid])
                        end

        respond_to do |format|
          format.html { render :index }
          format.json { render json: @api_v1_users.to_json(except: [:password]) }
        end
      end

      # POST /api/v1/users
      def create
        unless Api::V1::Room.exists?(uuid: params[:api_v1_user][:room_uuid])
          render json: { verify: 'failed',
                         reason: 'no_such_room' } and return
        end
        unless Api::V1::Token.valid.check_room(
          params[:api_v1_user][:room_uuid], params[:room_token]
        )
          render json: { verify: 'failed',
                         reason: 'expire_room_token' } and return
        end

        api_v1_user = Api::V1::User.new(api_v1_user_params_for_create)
        if api_v1_user.save
          api_v1_token = Api::V1::Token.new(target_type: 'user', room_uuid: api_v1_user.room_uuid,
                                            user_uuid: api_v1_user.uuid)
          api_v1_token.save
          render json: { verify: 'success', token: api_v1_token.token, user: api_v1_user.attributes.reject do |key|
            key == 'password'
          end }
        else
          render json: api_v1_user.errors
        end
      end

      # PATCH/PUT /api/v1/users/1 or /api/v1/users/1.json
      def update
        unless Api::V1::Room.exists?(uuid: params[:room_uuid])
          render json: { verify: 'failed',
                         reason: 'no_such_room' } and return
        end
        unless Api::V1::Token.valid.check_room(
          params[:room_uuid], params[:room_token]
        )
          render json: { verify: 'failed',
                         reason: 'expire_room_token' } and return
        end
        render json: { verify: 'failed', reason: 'no_such_user' } and return unless Api::V1::User.exists?(
          uuid: params[:user_uuid], room_uuid: params[:room_uuid]
        )
        unless Api::V1::Token.valid.check_user(
          params[:room_uuid], params[:user_uuid], params[:user_token]
        )
          render json: { verify: 'failed',
                         reason: 'expire_user_token' } and return
        end

        api_v1_user = Api::V1::User.find_by(uuid: params[:user_uuid], room_uuid: params[:room_uuid])
        if api_v1_user.update(api_v1_user_params_for_update)
          render json: { verify: 'success' }
        else
          render json: @api_v1_user.errors
        end
      end

      # POST /api/v1/users/1/verify
      def login
        unless Api::V1::Room.exists?(uuid: params[:room_uuid])
          render json: { verify: 'failed',
                         reason: 'no_such_room' } and return
        end
        unless Api::V1::Token.valid.check_room(
          params[:room_uuid], params[:room_token]
        )
          render json: { verify: 'failed',
                         reason: 'expire_room_token' } and return
        end

        api_v1_user = Api::V1::User.find_by(uuid: params[:user_uuid], room_uuid: params[:room_uuid])
        render json: { verify: 'failed', reason: 'no_such_user' } and return if api_v1_user.nil?
        # noinspection RubyNilAnalysis
        unless BCrypt::Password.new(api_v1_user.password).is_password?(params[:password])
          render json: { verify: 'failed',
                         reason: 'invalid_password' } and return
        end

        api_v1_token = Api::V1::Token.create(target_type: 'user', room_uuid: params[:room_uuid],
                                             user_uuid: params[:user_uuid])

        api_v1_user.update(last_logged_in: DateTime.now)
        render json: { verify: 'success', user_token: api_v1_token.token }
      end

      # POST /api/v1/token/verify/users
      def check_token
        api_v1_room = Api::V1::Room.find_by(uuid: params[:room_uuid])
        render json: { verify: 'failed', reason: 'no_such_room' } and return if api_v1_room.nil?
        unless Api::V1::Token.valid.check_room(
          params[:room_uuid], params[:room_token]
        )
          render json: { verify: 'failed',
                         reason: 'expire_room_token' } and return
        end

        # noinspection RubyNilAnalysis
        base = { room: api_v1_room.attributes.reject do |key|
          key == 'password'
        end, users:    Api::V1::User.where(room_uuid: params[:room_uuid]).map do |user|
          user.attributes.reject do |key|
            key == 'password'
          end
        end }
        render json: { verify: 'failed', reason: 'no_such_user', **base } and return unless Api::V1::User.exists?(
          uuid: params[:user_uuid], room_uuid: params[:room_uuid]
        )
        unless Api::V1::Token.valid.check_user(
          params[:room_uuid], params[:user_uuid], params[:user_token]
        )
          render json: { verify: 'failed', reason: 'expire_user_token',
                         **base } and return
        end

        render json: {
          verify: 'success',
          **base,
          users: Api::V1::User.where(room_uuid: params[:room_uuid]).map do |user|
            user.attributes.reject { |key| key == 'password' }
          end
        }
      end

      def detail
        api_v1_user = Api::V1::User.find_by(uuid: params[:user_uuid])
        if api_v1_user.nil?
          render json: nil
        else
          render json: api_v1_user.to_json(except: ['password'])
        end
      end

      # DELETE /api/v1/users/1 or /api/v1/users/1.json
      def destroy
        @api_v1_user.destroy

        respond_to do |format|
          format.html { redirect_to api_v1_users_url, notice: 'User was successfully destroyed.' }
          format.json { head :no_content }
        end
      end

      private

      # Use callbacks to share common setup or constraints between actions.
      def set_api_v1_user
        @api_v1_user = Api::V1::User.find(params[:id])
      end

      # Only allow a list of trusted parameters through.
      def api_v1_user_params_for_create
        params.require(:api_v1_user).permit(:uuid, :name, :user_type, :password, :room_uuid, :last_logged_in)
      end

      # Only allow a list of trusted parameters through.
      def api_v1_user_params_for_update
        params.require(:api_v1_user).permit(:name, :user_type, :last_logged_in)
      end
    end
  end
end
