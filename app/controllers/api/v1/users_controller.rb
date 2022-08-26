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

  # POST /api/v1/users or /api/v1/users.json
  def create
    @api_v1_user = Api::V1::User.new(api_v1_user_params)

    respond_to do |format|
      if @api_v1_user.save
        format.html { redirect_to api_v1_users_url, notice: "User was successfully created." }
        format.json { render json: @api_v1_user.to_json(:only => [:id, :uuid, :name]), status: :created }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @api_v1_user.errors, status: :unprocessable_entity }
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
    verified = BCrypt::Password.new(@api_v1_user.password).is_password?(params[:password])
    result = { :verify => verified ? "success" : "failed" }
    result[:uuid] = @api_v1_user.uuid if verified
    render json: result
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
