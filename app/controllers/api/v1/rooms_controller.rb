class Api::V1::RoomsController < ApplicationController
  before_action :set_api_v1_room, only: %i[ edit update destroy ]

  # GET /api/v1/rooms or /api/v1/rooms.json
  def index
    @api_v1_rooms = Api::V1::Room.all

    respond_to do |format|
      format.html { render :index }
      format.json { render json: @api_v1_rooms.to_json(:except => [:password]) }
    end
  end

  # GET /api/v1/rooms/:room_uuid
  def detail
    api_v1_room = Api::V1::Room.find_by(:uuid => params[:room_uuid])
    if api_v1_room.nil?
      render json: nil
    else
      render json: api_v1_room.to_json(:except => ['password'])
    end
  end

  # POST /api/v1/rooms
  def create
    api_v1_room = Api::V1::Room.new(api_v1_room_params)
    if api_v1_room.save
      api_v1_token = Api::V1::Token.new(:target_type => 'room', :room_uuid => api_v1_room.uuid)
      api_v1_token.save
      render json: {:room_token => api_v1_token.token, :room => api_v1_room}.to_json(:only => [:room_token, :room, :id, :uuid, :name])
    else
      render json: api_v1_room.errors
    end
  end

  # PATCH/PUT /api/v1/rooms/1 or /api/v1/rooms/1.json
  def update
    respond_to do |format|
      if @api_v1_room.update(api_v1_room_params)
        format.html { redirect_to api_v1_rooms_path, notice: "Room was successfully updated." }
        format.json { render :show, status: :ok, location: @api_v1_room }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @api_v1_room.errors, status: :unprocessable_entity }
      end
    end
  end

  # POST api/v1/rooms/:room_uuid/login
  def login
    result = { :verify => 'failed' }

    api_v1_room = Api::V1::Room.find_by(:uuid => params[:room_uuid])
    if api_v1_room.nil?
      result[:reason] = 'no_such_room_uuid'
    else
      if BCrypt::Password.new(api_v1_room.password).is_password?(params[:password])
        result[:verify] = 'success'
        api_v1_token = Api::V1::Token.valid.find_by(:target_type => "room", :room_uuid => params[:room_uuid], :token => params[:room_token])
        if api_v1_token.nil?
          api_v1_token = Api::V1::Token.new(:target_type => 'room', :room_uuid => params[:room_uuid])
          api_v1_token.save
        end
        result[:room_token] = api_v1_token.token
        result[:users] = Api::V1::User.select(:id, :uuid, :name).where(:room_uuid => params[:room_uuid])
      else
        result[:reason] = 'invalid_password'
      end
    end
    render json: result
  end

  # POST api/v1/rooms/:room_uuid/token/:room_token/check
  def check_token
    result = {}
    token_row = Api::V1::Token.valid.check_room(params[:room_uuid], params[:room_token])
    if token_row.nil?
      result[:verify] = 'failed'
      result[:reason] = 'expired_room_token'
    else
      result[:verify] = 'success'
      result[:users] = Api::V1::User.select(:id, :uuid, :name).where(:room_uuid => params[:room_uuid])
    end
    render json: result
  end

  # DELETE /api/v1/rooms/1 or /api/v1/rooms/1.json
  def destroy
    @api_v1_room.destroy

    respond_to do |format|
      format.html { redirect_to api_v1_rooms_url, notice: "Room was successfully destroyed." }
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
end
