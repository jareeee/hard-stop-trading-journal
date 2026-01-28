class SessionSerializer
  include JSONAPI::Serializer
  attributes :id, :status, :started_at, :ended_at, :created_at

  attribute :trade_count do |object|
    object.trades.count
  end
end
