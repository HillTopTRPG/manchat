class Api::V1::UsersController < ApplicationController
  before_action :set_api_v1_user, only: %i[ show edit update verify destroy ]

  # GET /api/v1/users or /api/v1/users.json
  def index
    @api_v1_users = Api::V1::User.all

    respond_to do |format|
      format.html { render :index }
      format.json { render json: @api_v1_users.to_json(:except => [:password, :uuid]) }
    end
  end

  # GET /api/v1/users/1 or /api/v1/users/1.json
  def show
  end

  # GET /api/v1/users/new
  def new
    @api_v1_user = Api::V1::User.new
  end

  # GET /api/v1/users/1/edit
  def edit
  end

  # POST /api/v1/users
  def create
    result = {}
    token_row = Api::V1::Token.valid.room(params[:room_token]).first
    if token_row.nil?
      result[:verify] = "failed"
      result[:reason] = "expire_room_token"
      render json: result
    else
      if token_row.room_uuid != params[:api_v1_user][:room_uuid]
        result[:verify] = "failed"
        result[:reason] = "different_room_uuid"
        render json: result
      else
        @api_v1_user = Api::V1::User.new(api_v1_user_params)
        if @api_v1_user.save
          api_v1_token = Api::V1::Token.new(:target_type => 'user', :room_uuid => @api_v1_user.room_uuid, :user_uuid => @api_v1_user.uuid)
          api_v1_token.save
          result[:verify] = "success"
          result[:token] = api_v1_token.token
          result[:user] = @api_v1_user
          render json: result.to_json(:only => [:verify, :token, :user, :id, :uuid, :name])
        else
          render json: @api_v1_user.errors
        end
      end
    end
  end

  # PATCH/PUT /api/v1/users/1 or /api/v1/users/1.json
  def update
    respond_to do |format|
      if @api_v1_user.update(api_v1_user_params)
        format.html { redirect_to api_v1_users_url, notice: "User was successfully updated." }
        format.json { render :show, status: :ok, location: @api_v1_user }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @api_v1_user.errors, status: :unprocessable_entity }
      end
    end
  end

  # POST /api/v1/users/1/verify
  def verify
    result = {}
    tokenRow = Api::V1::Token.valid.room(params[:room_token]).first
    if tokenRow.nil?
      result[:verify] = "failed"
      result[:reason] = "expire_room_token"
    else
      if BCrypt::Password.new(@api_v1_user.password).is_password?(params[:password])
        if @api_v1_user.room_uuid != tokenRow[:room_uuid]
          result[:verify] = "failed"
          result[:reason] = "different_room_uuid"
        else
          api_v1_token = Api::V1::Token.new(:target_type => 'user', :room_uuid => @api_v1_user.room_uuid, :user_uuid => @api_v1_user.uuid)
          api_v1_token.save
          result[:verify] = "success"
          result[:token] = api_v1_token.token
          result[:uuid] = @api_v1_user.uuid
        end
      else
        result[:verify] = "failed"
        result[:reason] = "invalid_password"
      end
    end
    render json: result
  end

  # POST /api/v1/token/verify/users
  def verifyToken
    result = { :verify => "success", :reasons => [] }
    room_token_row = Api::V1::Token.valid.find_by(:target_type => "room", :room_uuid => params[:room_uuid], :token => params[:room_token])
    if room_token_row.nil?
      result[:verify] = "failed"
      api_v1_room = Api::V1::Room.find_by(:uuid => params[:room_uuid])
      if api_v1_room.nil?
        result[:reasons] << "not_found_room"
      else
        result[:reasons] << "expired_room_token"
        result[:room_id] = api_v1_room[:id]
        result[:room_uuid] = api_v1_room[:uuid]
      end
    end
    user_token_row = Api::V1::Token.valid.find_by(:target_type => "user", :user_uuid => params[:user_uuid], :token => params[:user_token])
    if user_token_row.nil?
      result[:verify] = "failed"
      api_v1_user = Api::V1::User.find_by(:uuid => params[:user_uuid])
      if api_v1_user.nil?
        result[:reasons] << "not_found_user"
      else
        result[:reasons] << "expired_user_token"
        result[:user_id] = api_v1_user[:id]
      end
    else
      if user_token_row.room_uuid != params[:room_uuid]
        result[:verify] = "failed"
        result[:reasons] << "different_room_uuid"
      end
    end
    render json: result
  end

  def detailByUUid
    @api_v1_user = Api::V1::User.find_by(:uuid => params[:user_uuid])
    render json: @api_v1_user.to_json(:except => ["password"])
  end

  # DELETE /api/v1/users/1 or /api/v1/users/1.json
  def destroy
    @api_v1_user.destroy

    respond_to do |format|
      format.html { redirect_to api_v1_users_url, notice: "User was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_api_v1_user
      @api_v1_user = Api::V1::User.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def api_v1_user_params
      params.require(:api_v1_user).permit(:uuid, :name, :password, :room_uuid, :last_logged_in)
    end
end
