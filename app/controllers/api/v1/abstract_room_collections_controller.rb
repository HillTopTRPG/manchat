# frozen_string_literal: true

module Api
  module V1
    class AbstractRoomCollectionsController < HasTokenController
      # GET /api/v1/~~~
      def index
        render json: params[:room_uuid].nil? ? model.all : model.where(room_uuid: params[:room_uuid])
      end

      # POST /api/v1/~~~
      def create
        return if get_room_user(params).nil?

        data = model.new(params_for_create)
        data.room_uuid = params[:room_uuid]
        render json: data.save ? { verify: 'success' } : data.errors
      end

      # PATCH /api/v1/~~~/:uuid
      def update
        return if (data = get_data(params)).nil?

        render json: data.update(params_for_update) ? { verify: 'success' } : api_v1_user.errors
      end

      # DELETE /api/v1/~~~/:uuid
      def destroy
        return if (data = get_data(params)).nil?

        data.destroy
        render json: { verify: 'success' }
      end

      protected

      def model
        raise 'abstract method'
      end

      def params_for_create
        raise 'abstract method'
      end

      def params_for_update
        raise 'abstract method'
      end

      private

      def get_data(params)
        return if (api_v1_user = get_room_user(params)).nil?

        data = model.find_by(room_uuid: api_v1_user.room_uuid, uuid: params[:uuid])
        render json: { verify: 'failure', reason: 'no_such_data' } if data.nil?
        data.nil? ? nil : data
      end
    end
  end
end
