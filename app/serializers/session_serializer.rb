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

  attribute :trades do |object|
    object.trades.order(opened_at: :desc).map do |trade|
      {
        id: trade.id,
        asset: trade.asset,
        direction: trade.direction,
        entry_price: trade.entry_price,
        stop_loss: trade.stop_loss,
        target_price: trade.target_price,
        close_price: trade.close_price,
        risk_percent: trade.risk_percent,
        pnl_gross: trade.pnl_gross,
        pnl_net: trade.pnl_net,
        fee: trade.fee,
        result: trade.result,
        opened_at: trade.opened_at,
        closed_at: trade.closed_at,
        strategy: trade.strategy ? { id: trade.strategy.id, name: trade.strategy.name } : nil
      }
    end
  end
end
