class StrategiesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_strategy, only: %i[show update destroy]

  def index
    strategies = current_user.strategies.order(created_at: :desc)
    render json: StrategySerializer.new(strategies).serializable_hash
  end

  def show
    render json: StrategySerializer.new(@strategy).serializable_hash
  end

  def create
    strategy = current_user.strategies.build(strategy_params)
    if strategy.save
      render json: StrategySerializer.new(strategy).serializable_hash, status: :created
    else
      render json: { errors: strategy.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @strategy.update(strategy_params)
      render json: StrategySerializer.new(@strategy).serializable_hash
    else
      render json: { errors: @strategy.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @strategy.destroy
  end

  private

  def set_strategy
    @strategy = current_user.strategies.find(params[:id])
  end

  def strategy_params
    params.require(:strategy).permit(:name, :description, :is_active)
  end
end
