class CurrentUserController < ApplicationController
  before_action :authenticate_user!

  def show
    render json: {
      status: { code: 200, message: "Logged in successfully." },
      data: UserSerializer.new(current_user).serializable_hash[:data][:attributes]
    }
  end
end
