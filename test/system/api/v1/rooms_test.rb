# frozen_string_literal: true

require 'application_system_test_case'

module Api
  module V1
    class RoomsTest < ApplicationSystemTestCase
      setup do
        @api_v1_room = api_v1_rooms(:one)
      end

      test 'visiting the index' do
        visit api_v1_rooms_url
        assert_selector 'h1', text: 'Rooms'
      end

      test 'should create room' do
        visit api_v1_rooms_url
        click_on 'New room'

        fill_in 'Last logged in', with: @api_v1_room.last_logged_in
        fill_in 'Name', with: @api_v1_room.name
        fill_in 'Password', with: @api_v1_room.password
        fill_in 'Uuid', with: @api_v1_room.uuid
        click_on 'Create Room'

        assert_text 'Room was successfully created'
        click_on 'Back'
      end

      test 'should update Room' do
        visit api_v1_room_url(@api_v1_room)
        click_on 'Edit this room', match: :first

        fill_in 'Last logged in', with: @api_v1_room.last_logged_in
        fill_in 'Name', with: @api_v1_room.name
        fill_in 'Password', with: @api_v1_room.password
        fill_in 'Uuid', with: @api_v1_room.uuid
        click_on 'Update Room'

        assert_text 'Room was successfully updated'
        click_on 'Back'
      end

      test 'should destroy Room' do
        visit api_v1_room_url(@api_v1_room)
        click_on 'Destroy this room', match: :first

        assert_text 'Room was successfully destroyed'
      end
    end
  end
end
