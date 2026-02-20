class TradesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_trade, only: %i[show update destroy]
  before_action :ensure_active_session, only: %i[create]

  def index
    # Fetch trades through user's sessions
    trades = current_user.trades.includes(:strategy, :session).order(opened_at: :desc)
    render json: TradeSerializer.new(trades).serializable_hash
  end

  def show
    render json: TradeSerializer.new(@trade).serializable_hash
  end

  def create
    session = Session.current_for(current_user)

    # Safety check, though ensure_active_session should handle it
    unless session
      return render json: { error: "No active session found" }, status: :unprocessable_entity
    end

    trade = session.trades.build(trade_params)

    if trade.save
      render json: TradeSerializer.new(trade).serializable_hash, status: :created
    else
      render json: { errors: trade.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @trade.update(trade_params)
      render json: TradeSerializer.new(@trade).serializable_hash
    else
      render json: { errors: @trade.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @trade.destroy
  end

  private

  def set_trade
    @trade = current_user.trades.find(params[:id])
  end

  def ensure_active_session
    unless Session.current_for(current_user)
      render json: { error: "You must have an active trading session to place a trade." }, status: :forbidden
    end
  end

  def trade_params
    params.require(:trade).permit(:asset, :direction, :entry_price, :quantity, :stop_loss,
                                  :target_price, :close_price, :risk_percent,
                                  :strategy_id, :result, :closed_at)
  end
end
