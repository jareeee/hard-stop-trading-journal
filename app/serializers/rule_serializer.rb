class RuleSerializer
  include JSONAPI::Serializer
  attributes :id, :max_consecutive_losses, :max_daily_drawdown_percent,
             :max_trades_per_session, :max_trades_per_hour,
             :cooldown_minutes_after_loss, :enforce_strategy,
             :created_at
end
