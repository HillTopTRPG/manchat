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

        data = make_create_data
        render json: data.save ? { verify: 'success' } : data.errors
      end

      def make_create_data
        data = model.new(params_for_create)
        data.room_uuid = params[:room_uuid]
        data
      end

      # PATCH /api/v1/~~~/:uuid
      def update
        return if (data = get_data(params)).nil?

        render json: data.update(params_for_update) ? { verify: 'success' } : api_v1_user.errors
      end

      # DELETE /api/v1/~~~/:uuid
      def destroy
        return if (data = get_data(params)).nil?

        # リクエストによる処理では登録者しかデータを削除できないようにする
        if data.owner_user == params[:user_uuid]
          data.destroy
          render json: { verify: 'success' }
        else
          render json: { verify: 'failed different owner.' }
        end
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
