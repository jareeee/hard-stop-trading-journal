class RulesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_rule, only: %i[show update destroy]

  def index
    rules = current_user.rules.order(created_at: :desc)
    render json: RuleSerializer.new(rules).serializable_hash
  end

  def show
    render json: RuleSerializer.new(@rule).serializable_hash
  end

  def create
    rule = current_user.rules.build(rule_params)
    if rule.save
      render json: RuleSerializer.new(rule).serializable_hash, status: :created
    else
      render json: { errors: rule.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @rule.update(rule_params)
      render json: RuleSerializer.new(@rule).serializable_hash
    else
      render json: { errors: @rule.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @rule.destroy
  end

  private

  def set_rule
    @rule = current_user.rules.find(params[:id])
  end

  def rule_params
    params.require(:rule).permit(:max_consecutive_losses, :max_daily_drawdown_percent,
                                 :max_trades_per_session, :max_trades_per_hour,
                                 :cooldown_minutes_after_loss, :enforce_strategy)
  end
end
