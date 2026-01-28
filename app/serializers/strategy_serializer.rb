class StrategySerializer
  include JSONAPI::Serializer
  attributes :id, :name, :description, :is_active, :created_at
end
