class Api::V1::TokensController < ApplicationController
  before_action :set_api_v1_token, only: %i[ show edit update destroy ]

  # GET /api/v1/tokens or /api/v1/tokens.json
  def index
    @api_v1_tokens = Api::V1::Token.all
  end

  # GET /api/v1/tokens/1 or /api/v1/tokens/1.json
  def show
  end

  # GET /api/v1/tokens/new
  def new
    @api_v1_token = Api::V1::Token.new
  end

  # GET /api/v1/tokens/1/edit
  def edit
  end

  # POST /api/v1/tokens or /api/v1/tokens.json
  def create
    @api_v1_token = Api::V1::Token.new(api_v1_token_params)

    respond_to do |format|
      if @api_v1_token.save
        format.html { redirect_to api_v1_tokens_url, notice: "Token was successfully created." }
        format.json { render :show, status: :created, location: @api_v1_token }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @api_v1_token.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /api/v1/tokens/1 or /api/v1/tokens/1.json
  def update
    respond_to do |format|
      if @api_v1_token.update(api_v1_token_params)
        format.html { redirect_to api_v1_tokens_url, notice: "Token was successfully updated." }
        format.json { render :show, status: :ok, location: @api_v1_token }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @api_v1_token.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /api/v1/tokens/1 or /api/v1/tokens/1.json
  def destroy
    @api_v1_token.destroy

    respond_to do |format|
      format.html { redirect_to api_v1_tokens_url, notice: "Token was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_api_v1_token
    @api_v1_token = Api::V1::Token.find(params[:id])
  end

  # Only allow a list of trusted parameters through.
  def api_v1_token_params
    params.require(:api_v1_token).permit(:target_type, :room_uuid, :user_uuid, :token)
  end
end
