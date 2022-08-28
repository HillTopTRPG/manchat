class Api::V1::RoomsController < ApplicationController
  before_action :set_api_v1_room, only: %i[ show edit update verify destroy ]

  # GET /api/v1/rooms or /api/v1/rooms.json
  def index
    @api_v1_rooms = Api::V1::Room.all

    respond_to do |format|
      format.html { render :index }
      format.json { render json: @api_v1_rooms.to_json(:except => [:password, :uuid]) }
    end
  end

  # GET /api/v1/rooms/1 or /api/v1/rooms/1.json
  def show
    respond_to do |format|
      format.html { render :show }
      format.json { render json: @api_v1_room.to_json(:except => [:password, :uuid]) }
    end
  end

  # GET /api/v1/rooms/new
  def new
    @api_v1_room = Api::V1::Room.new
  end

  # GET /api/v1/rooms/1/edit
  def edit
  end

  # POST /api/v1/rooms or /api/v1/rooms.json
  def create
    @api_v1_room = Api::V1::Room.new(api_v1_room_params)

    respond_to do |format|
      if @api_v1_room.save
        api_v1_token = Api::V1::Token.new(:target_type => 'room', :room_uuid => @api_v1_room.uuid)
        api_v1_token.save
        format.html { redirect_to api_v1_rooms_path, notice: "Room was successfully created." }
        format.json { render json: {:token => api_v1_token.token, :room => @api_v1_room}.to_json(:only => [:token, :room, :id, :uuid, :name]), status: :created }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @api_v1_room.errors, status: :unprocessable_entity }
      end
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

  # POST /api/v1/rooms/1/verify
  def verify
    verified = BCrypt::Password.new(@api_v1_room.password).is_password?(params[:password])

    result = { :verify => verified ? "success" : "failed" }
    if verified
      api_v1_token = Api::V1::Token.new(:target_type => 'room', :room_uuid => @api_v1_room.uuid)
      api_v1_token.save
      result[:token] = api_v1_token.token
      result[:uuid] = @api_v1_room.uuid
      result[:users] = Api::V1::User.select(:id, :name).where(:room_uuid => @api_v1_room.uuid)
    end
    render json: result
  end

  # POST /api/v1/token/verify/rooms
  def verifyToken
    room_uuid = params[:room_uuid]
    token = params[:token]
    verified = Api::V1::Token.valid.where(:target_type => "room", :room_uuid => room_uuid, :token => token).count > 0
    result = { :verify => verified ? "success" : "failed" }
    if verified
      result[:users] = Api::V1::User.select(:id, :name).where(:room_uuid => room_uuid)
    end
    render json: result
  end

  def detailByUUid
    @api_v1_room = Api::V1::Room.find_by(:uuid => params[:room_uuid])
    render json: @api_v1_room
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
