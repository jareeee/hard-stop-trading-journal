class SessionsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_session, only: %i[show update]

  def index
    sessions = current_user.sessions.order(started_at: :desc)
    render json: SessionSerializer.new(sessions).serializable_hash
  end

  def show
    render json: SessionSerializer.new(@session).serializable_hash
  end

  def create
    # Only allow one active session per user for simplicity, or just create a new one.
    # Logic: if there is an active session, return it? Or error?
    # For now, let's just create a new one.

    active_session = Session.current_for(current_user)
    if active_session
       render json: SessionSerializer.new(active_session).serializable_hash
       return
    end

    session = current_user.sessions.build(started_at: Time.current, status: "active")

    # Associate mostly recently created rule if exists
    latest_rule = current_user.rules.last
    session.rule = latest_rule if latest_rule

    if session.save
      render json: SessionSerializer.new(session).serializable_hash, status: :created
    else
      render json: { errors: session.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @session.update(session_params)
      render json: SessionSerializer.new(@session).serializable_hash
    else
      render json: { errors: @session.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_session
    @session = current_user.sessions.find(params[:id])
  end

  def session_params
    params.require(:session).permit(:status, :ended_at)
  end
end
