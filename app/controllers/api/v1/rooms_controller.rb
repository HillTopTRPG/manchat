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
      render json: { :success => true, :room_token => api_v1_token.token, :room => api_v1_room.attributes.reject { |key| key == 'password' } }
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
    api_v1_room = Api::V1::Room.find_by(:uuid => params[:room_uuid])
    render json: { :verify => 'failed', :reason => 'no_such_room' } and return if api_v1_room.nil?
    #noinspection RubyNilAnalysis
    render json: { :verify => 'failed', :reason => 'invalid_password' } and return unless BCrypt::Password.new(api_v1_room.password).is_password?(params[:password])
    api_v1_token = Api::V1::Token.new(:target_type => 'room', :room_uuid => params[:room_uuid])
    api_v1_token.save
    render json: {
      :verify     => 'success',
      :room_token => api_v1_token.token,
      :users      => Api::V1::User.where(:room_uuid => params[:room_uuid]).map { |user| user.attributes.reject { |key| key == 'password' } }
    }
  end

  # POST api/v1/rooms/:room_uuid/token/:room_token/check
  def check_token
    api_v1_room = Api::V1::Room.find_by(:uuid => params[:room_uuid])
    render json: { :verify => 'failed', :reason => 'no_such_room' } and return if api_v1_room.nil?
    render json: { :verify => 'failed', :reason => 'expired_room_token' } and return unless Api::V1::Token.valid.check_room(params[:room_uuid], params[:room_token])
    #noinspection RubyNilAnalysis
    render json: {
      :verify => 'success',
      :room   => api_v1_room.attributes.reject { |key| key == 'password' },
      :users  => Api::V1::User.where(:room_uuid => params[:room_uuid]).map { |user| user.attributes.reject { |key| key == 'password' } }
    }
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
