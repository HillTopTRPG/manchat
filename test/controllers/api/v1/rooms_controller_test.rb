# frozen_string_literal: true

require 'test_helper'

class Api
  class V1
    class RoomsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @api_v1_room = api_v1_rooms(:one)
      end

      test 'should get index' do
        get api_v1_rooms_url
        assert_response :success
      end

      test 'should get new' do
        get new_api_v1_room_url
        assert_response :success
      end

      test 'should create api_v1_room' do
        assert_difference('Api::V1::Room.count') do
          post api_v1_rooms_url,
               params: { api_v1_room: { last_logged_in: @api_v1_room.last_logged_in, name: @api_v1_room.name,
                                        password: @api_v1_room.password, uuid: @api_v1_room.uuid } }
        end

        assert_redirected_to api_v1_room_url(Api::V1::Room.last)
      end

      test 'should show api_v1_room' do
        get api_v1_room_url(@api_v1_room)
        assert_response :success
      end

      test 'should get edit' do
        get edit_api_v1_room_url(@api_v1_room)
        assert_response :success
      end

      test 'should update api_v1_room' do
        patch api_v1_room_url(@api_v1_room),
              params: { api_v1_room: { last_logged_in: @api_v1_room.last_logged_in, name: @api_v1_room.name,
                                       password: @api_v1_room.password, uuid: @api_v1_room.uuid } }
        assert_redirected_to api_v1_room_url(@api_v1_room)
      end

      test 'should destroy api_v1_room' do
        assert_difference('Api::V1::Room.count', -1) do
          delete api_v1_room_url(@api_v1_room)
        end

        assert_redirected_to api_v1_rooms_url
      end
    end
  end
end
