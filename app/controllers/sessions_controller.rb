class SessionsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_session, only: %i[show update stats]

  def index
    sessions = current_user.sessions.includes(:rule).order(started_at: :desc)
    render json: SessionSerializer.new(sessions).serializable_hash
  end

  def show
    render json: SessionSerializer.new(@session).serializable_hash
  end

  def create
    # Check if there is already an active session
    active_session = Session.current_for(current_user)
    if active_session
      render json: SessionSerializer.new(active_session).serializable_hash
      return
    end

    session = current_user.sessions.build(
      started_at: Time.current,
      status: "active"
    )

    # Handle rule_id from params or use latest rule
    if session_params[:rule_id].present?
      rule = current_user.rules.find_by(id: session_params[:rule_id])
      session.rule = rule if rule
    else
      # Fallback to most recent rule
      latest_rule = current_user.rules.order(created_at: :desc).first
      session.rule = latest_rule if latest_rule
    end

    if session.save
      # Handle strategy associations if provided
      if session_params[:strategy_ids].present?
        strategy_ids = session_params[:strategy_ids]
        strategies = current_user.strategies.where(id: strategy_ids)
        session.strategies << strategies if strategies.any?
      end

      render json: SessionSerializer.new(session).serializable_hash, status: :created
    else
      render json: { errors: session.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @session.update(update_session_params)
      render json: SessionSerializer.new(@session).serializable_hash
    else
      render json: { errors: @session.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /sessions/:id/stats
  # Returns real-time stats for the session including trades, drawdown, and warnings
  def stats
    render json: @session.stats
  end

  private

  def set_session
    @session = current_user.sessions.find(params[:id])
  end

  def session_params
    params.require(:session).permit(:rule_id, strategy_ids: [])
  end

  def update_session_params
    params.require(:session).permit(:status, :ended_at)
  end
end
