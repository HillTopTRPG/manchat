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
        if params.has_key?(:record)
          data = model.new(params.require(:record).permit(*params_for_create))
          make_create_data data
          render json: data.save ? { verify: 'success' } : data.errors
        elsif params.has_key?(:records)
          if params.require(:records).empty?
            render json: { verify: 'empty' }
            return
          end
          records = params.require(:records)
          now = Time.current
          uuid_list = Array.new(records.size) { SecureRandom.uuid }
          uuid_list.map!.with_index do |uuid, idx|
            other_list = uuid_list.reject.with_index { |_, ridx| ridx == idx }
            while other_list.include?(uuid) || model.exists?(uuid: uuid) do
              uuid = SecureRandom.uuid
            end
            uuid
          end
          data_list = records.map.with_index do |record, idx|
            make_create_data(model.new(record.permit(*params_for_create))).attributes.merge(uuid: uuid_list[idx], created_at: now, updated_at: now)
          end
          model.insert_all(data_list, record_timestamps: true)
          render json: { verify: 'success' }
          ActionCable.server.broadcast(
            "room_#{params[:room_uuid]}",
            {
              type: 'create-data',
              table: model.table_name,
              dataList: data_list
            }
          )
        end
      end

      def make_create_data(data)
        data[:room_uuid] = params[:room_uuid]
        data
      end

      # PATCH /api/v1/~~~/:uuid
      def update
        return if (data = get_data(params)).nil?

        # render json: data.update(params.require(:record).permit(*params_for_update)) ? { verify: 'success' } : api_v1_user.errors.to_h
        p api_v1_user.errors
        render json: data.update(params_for_update) ? { verify: 'success' } : api_v1_user.errors.to_h
      end

      # DELETE /api/v1/~~~/:uuid
      def destroy
        return if (api_v1_user = get_room_user(params)).nil?
        targets = model.where(room_uuid: api_v1_user.room_uuid, uuid: params[:uuids])
        if targets.empty?
          render json: { verify: 'failure', reason: 'no_such_data' }
          return
        end
        if targets.to_a.any? { |target| !model.has_attribute?(:owner_user) && target.owner_user != params[:user_uuid] }
          render json: { verify: 'failure', reason: 'failed contain different owner data.' }
          return
        end

        begin
          ActiveRecord::Base.transaction do
            targets.in_batches.each do |target_group|
              target_group.map(&:destroy!)
              sleep(0.1)
            end
          end
          render json: { verify: 'success' }
        rescue => err
          render json: err
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
