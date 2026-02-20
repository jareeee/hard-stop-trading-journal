class DashboardController < ApplicationController
  before_action :authenticate_user!

  def stats
    trades = current_user.trades.includes(:strategy, :session)

    # Calculate metrics
    stats = {
      account_balance: calculate_account_balance(trades),
      profit_factor: calculate_profit_factor(trades),
      realized_risk_reward: calculate_realized_rr(trades),
      sessions: calculate_sessions,
      performance_curve: calculate_performance_curve(trades),
      balance_history: current_user.balance_transactions.order(created_at: :desc).limit(10)
    }

    render json: stats
  end

  private

  def calculate_account_balance(trades)
    closed_trades = closed_trades_for(trades)
    total_pnl = closed_trades.sum { |trade| effective_pnl_for(trade) }

    # Get current balance from balance_transactions
    current_balance = BalanceTransaction.current_balance_for(current_user)

    # Get starting balance (first transaction or default)
    starting_balance = BalanceTransaction.starting_balance_for(current_user)

    # Calculate total account value (balance + unrealized PnL from trades)
    account_value = current_balance + total_pnl

    # Calculate percentage change from starting balance
    pnl_percent = starting_balance > 0 ? (((account_value - starting_balance) / starting_balance) * 100).round(2) : 0

    # Calculate change vs last month (optional - can be expanded)
    last_month_start = 1.month.ago.beginning_of_month
    pnl_vs_last_month = closed_trades
      .select { |trade| trade.closed_at.present? && trade.closed_at >= last_month_start }
      .sum { |trade| effective_pnl_for(trade) }
    pnl_vs_last_month_percent = starting_balance > 0 ? ((pnl_vs_last_month / starting_balance) * 100).round(2) : 0

    {
      current: account_value.round(2),
      pnl: total_pnl.round(2),
      pnl_percent: pnl_percent,
      starting: starting_balance.round(2),
      pnl_vs_last_month: pnl_vs_last_month.round(2),
      pnl_vs_last_month_percent: pnl_vs_last_month_percent
    }
  end

  def calculate_profit_factor(trades)
    closed_trades = closed_trades_for(trades)
    pnl_values = closed_trades.map { |trade| effective_pnl_for(trade) }
    winning_values = pnl_values.select(&:positive?)
    losing_values = pnl_values.select(&:negative?)

    gross_profit = winning_values.sum
    gross_loss = losing_values.sum.abs
    optimal_target = 2.0

    if pnl_values.empty?
      return {
        value: nil,
        display: "N/A",
        optimal: optimal_target,
        percent_of_target: nil,
        status: "neutral",
        note: "Need closed trades to calculate profit factor",
        samples: {
          wins: 0,
          losses: 0
        }
      }
    end

    if gross_loss.zero? && gross_profit.positive?
      return {
        value: nil,
        display: "∞",
        optimal: optimal_target,
        percent_of_target: nil,
        status: "up",
        note: "No losing trades yet",
        samples: {
          wins: winning_values.size,
          losses: losing_values.size
        }
      }
    end

    profit_factor = gross_loss.positive? ? (gross_profit / gross_loss).round(2) : 0.0
    percent_of_target = ((profit_factor / optimal_target) * 100).round(0)

    {
      value: profit_factor,
      display: format("%.2f", profit_factor),
      optimal: optimal_target,
      percent_of_target: percent_of_target,
      status: profit_factor >= optimal_target ? "up" : "down",
      note: nil,
      samples: {
        wins: winning_values.size,
        losses: losing_values.size
      }
    }
  end

  def calculate_realized_rr(trades)
    closed_trades = closed_trades_for(trades)
    pnl_values = closed_trades.map { |trade| effective_pnl_for(trade) }
    winning_values = pnl_values.select(&:positive?)
    losing_values = pnl_values.select(&:negative?).map(&:abs)

    if winning_values.empty? || losing_values.empty?
      return {
        value: nil,
        historical_avg: nil,
        deviation_percent: nil,
        status: "neutral",
        note: "Need at least 1 winning and 1 losing trade",
        samples: {
          wins: winning_values.size,
          losses: losing_values.size
        }
      }
    end

    avg_win = winning_values.sum / winning_values.size
    avg_loss = losing_values.sum / losing_values.size

    rr_ratio = (avg_win / avg_loss).round(1)

    # Placeholder baseline until a true historical baseline is implemented.
    historical_avg = 2.0
    deviation_percent = historical_avg.positive? ? (((rr_ratio - historical_avg) / historical_avg) * 100).round(1) : nil

    {
      value: rr_ratio,
      historical_avg: historical_avg,
      deviation_percent: deviation_percent,
      status: deviation_percent&.negative? ? "down" : "up",
      note: nil,
      samples: {
        wins: winning_values.size,
        losses: losing_values.size
      }
    }
  end

  def calculate_sessions
    active_session = Session.current_for(current_user)
    total_sessions = current_user.sessions.count

    {
      active: active_session.present?,
      total: total_sessions,
      current_session: active_session ? {
        id: active_session.id,
        started_at: active_session.started_at,
        trades_count: active_session.trades.count,
        limits: active_session.stats
      } : nil
    }
  end

  def calculate_performance_curve(trades)
    closed_trades = closed_trades_for(trades)

    starting_balance = BalanceTransaction.starting_balance_for(current_user)
    cumulative_balance = starting_balance

    data_points = []

    # Add starting point
    data_points << {
      date: (closed_trades.first&.closed_at || Time.current).to_date,
      equity: starting_balance,
      balance: starting_balance
    }

    closed_trades.each do |trade|
      cumulative_balance += effective_pnl_for(trade)

      data_points << {
        date: trade.closed_at.to_date,
        equity: cumulative_balance.round(2),
        balance: cumulative_balance.round(2)
      }
    end

    # Calculate max drawdown
    peak = starting_balance
    max_drawdown = 0
    max_drawdown_date = nil

    data_points.each do |point|
      if point[:equity] > peak
        peak = point[:equity]
      elsif peak.positive?
        drawdown = ((peak - point[:equity]) / peak * 100).round(2)
        if drawdown > max_drawdown
          max_drawdown = drawdown
          max_drawdown_date = point[:date]
        end
      end
    end

    {
      data: data_points,
      max_drawdown: max_drawdown,
      max_drawdown_date: max_drawdown_date
    }
  end

  def closed_trades_for(trades)
    trades.where.not(closed_at: nil).order(closed_at: :asc).to_a
  end

  def effective_pnl_for(trade)
    return trade.pnl_net.to_f if trade.pnl_net.present?
    return 0.0 unless trade.entry_price.present? && trade.close_price.present? && trade.direction.present? && trade.quantity.present?

    price_delta = trade.close_price.to_d - trade.entry_price.to_d
    gross_pnl = (trade.direction == "short" ? -price_delta : price_delta) * trade.quantity.to_d
    (gross_pnl - trade.fee.to_d).round(2).to_f
  end
end
