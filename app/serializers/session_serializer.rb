class SessionSerializer
  include JSONAPI::Serializer
  attributes :id, :status, :started_at, :ended_at, :created_at

  attribute :trade_count do |object|
    object.trades.count
  end

  attribute :rule do |object|
    if object.rule
      {
        id: object.rule.id,
        max_consecutive_losses: object.rule.max_consecutive_losses,
        max_daily_drawdown_percent: object.rule.max_daily_drawdown_percent,
        max_trades_per_session: object.rule.max_trades_per_session,
        max_trades_per_hour: object.rule.max_trades_per_hour,
        enforce_strategy: object.rule.enforce_strategy
      }
    end
  end

  attribute :strategies do |object|
    object.strategies.map { |s| { id: s.id, name: s.name } }
  end
end
