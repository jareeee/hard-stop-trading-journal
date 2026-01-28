class TradeSerializer
  include JSONAPI::Serializer
  attributes :id, :asset, :direction, :entry_price, :stop_loss, :target_price,
             :close_price, :pnl_net, :result, :opened_at, :closed_at

  belongs_to :strategy
  belongs_to :session
end
