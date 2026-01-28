class Rule < ApplicationRecord
  belongs_to :user

  validates :max_consecutive_losses, numericality: { greater_than: 0 }, allow_nil: true
  validates :max_daily_drawdown_percent, numericality: { greater_than: 0, less_than_or_equal_to: 100 }, allow_nil: true
  validates :max_trades_per_session, numericality: { greater_than: 0 }, allow_nil: true
end
