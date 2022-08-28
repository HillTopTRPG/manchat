require "application_system_test_case"

class Api::V1::TokensTest < ApplicationSystemTestCase
  setup do
    @api_v1_token = api_v1_tokens(:one)
  end

  test "visiting the index" do
    visit api_v1_tokens_url
    assert_selector "h1", text: "Tokens"
  end

  test "should create token" do
    visit api_v1_tokens_url
    click_on "New token"

    fill_in "Target type", with: @api_v1_token.target_type
    fill_in "Target uuid", with: @api_v1_token.target_uuid
    fill_in "Token", with: @api_v1_token.token
    click_on "Create Token"

    assert_text "Token was successfully created"
    click_on "Back"
  end

  test "should update Token" do
    visit api_v1_token_url(@api_v1_token)
    click_on "Edit this token", match: :first

    fill_in "Target type", with: @api_v1_token.target_type
    fill_in "Target uuid", with: @api_v1_token.target_uuid
    fill_in "Token", with: @api_v1_token.token
    click_on "Update Token"

    assert_text "Token was successfully updated"
    click_on "Back"
  end

  test "should destroy Token" do
    visit api_v1_token_url(@api_v1_token)
    click_on "Destroy this token", match: :first

    assert_text "Token was successfully destroyed"
  end
end
