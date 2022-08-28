require "test_helper"

class Api::V1::TokensControllerTest < ActionDispatch::IntegrationTest
  setup do
    @api_v1_token = api_v1_tokens(:one)
  end

  test "should get index" do
    get api_v1_tokens_url
    assert_response :success
  end

  test "should get new" do
    get new_api_v1_token_url
    assert_response :success
  end

  test "should create api_v1_token" do
    assert_difference("Api::V1::Token.count") do
      post api_v1_tokens_url, params: { api_v1_token: { target_type: @api_v1_token.target_type, target_uuid: @api_v1_token.target_uuid, token: @api_v1_token.token } }
    end

    assert_redirected_to api_v1_token_url(Api::V1::Token.last)
  end

  test "should show api_v1_token" do
    get api_v1_token_url(@api_v1_token)
    assert_response :success
  end

  test "should get edit" do
    get edit_api_v1_token_url(@api_v1_token)
    assert_response :success
  end

  test "should update api_v1_token" do
    patch api_v1_token_url(@api_v1_token), params: { api_v1_token: { target_type: @api_v1_token.target_type, target_uuid: @api_v1_token.target_uuid, token: @api_v1_token.token } }
    assert_redirected_to api_v1_token_url(@api_v1_token)
  end

  test "should destroy api_v1_token" do
    assert_difference("Api::V1::Token.count", -1) do
      delete api_v1_token_url(@api_v1_token)
    end

    assert_redirected_to api_v1_tokens_url
  end
end
