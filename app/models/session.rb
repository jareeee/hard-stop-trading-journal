class Session < ApplicationRecord
  belongs_to :user
  belongs_to :rule, optional: true
  has_many :trades, dependent: :destroy
  has_many :session_strategies, dependent: :destroy
  has_many :strategies, through: :session_strategies

  validates :status, presence: true, inclusion: { in: %w[active ended] }
  validates :started_at, presence: true

  # Helper to find or create active session for user
  def self.current_for(user)
    user.sessions.where(status: "active").order(created_at: :desc).first
  end

  # Check if session has reached any limits
  def limit_reached?
    return false unless rule

    stats_data = stats
    return false unless stats_data

    # Check trade limit
    if stats_data[:trades][:max] && stats_data[:trades][:remaining] == 0
      return true
    end

    # Check drawdown limit
    if stats_data[:drawdown][:max] && stats_data[:drawdown][:remaining] &&
       stats_data[:drawdown][:remaining] <= 0
      return true
    end

    # Check consecutive loss limit
    if stats_data[:losses][:max] && stats_data[:losses][:remaining] == 0
      return true
    end

    false
  end

  def stats
    return nil unless rule

    current_trades = trades.count
    max_trades = rule.max_trades_per_session
    remaining_trades = max_trades ? [ max_trades - current_trades, 0 ].max : nil

    starting_balance = BalanceTransaction.current_balance_for(user)
    current_pnl = trades.sum(:pnl_net) || 0
    drawdown_percent = current_pnl < 0 ? (current_pnl.abs / starting_balance * 100).round(2) : 0
    max_drawdown = rule.max_daily_drawdown_percent
    remaining_drawdown = max_drawdown ? [ max_drawdown - drawdown_percent, 0 ].max : nil

    recent_trades = trades.order(closed_at: :desc)
    consecutive_losses = 0
    recent_trades.each do |t|
      if t.result == "loss"
        consecutive_losses += 1
      else
        break
      end
    end
    max_losses = rule.max_consecutive_losses
    remaining_losses = max_losses ? [ max_losses - consecutive_losses, 0 ].max : nil

    warnings = []
    warnings << "Approaching trade limit" if remaining_trades && remaining_trades <= 1
    warnings << "High drawdown warning" if remaining_drawdown && max_drawdown && remaining_drawdown <= (max_drawdown * 0.2)
    warnings << "Risk of consecutive loss limit" if remaining_losses && remaining_losses <= 1

    {
      trades: {
        current: current_trades,
        max: max_trades,
        remaining: remaining_trades
      },
      drawdown: {
        current: drawdown_percent,
        max: max_drawdown,
        remaining: remaining_drawdown
      },
      losses: {
        current: consecutive_losses,
        max: max_losses,
        remaining: remaining_losses
      },
      warnings: warnings
    }
  end
end
