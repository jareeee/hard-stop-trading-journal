import api from '../api/axios';

export interface DashboardStats {
  account_balance: {
    current: number;
    pnl: number;
    pnl_percent: number;
    starting: number;
    pnl_vs_last_month: number;
    pnl_vs_last_month_percent: number;
  };
  profit_factor: {
    value: number | null;
    display: string;
    optimal: number;
    percent_of_target: number | null;
    status: 'up' | 'down' | 'neutral';
    note: string | null;
    samples: {
      wins: number;
      losses: number;
    };
  };
  realized_risk_reward: {
    value: number | null;
    historical_avg: number | null;
    deviation_percent: number | null;
    status: 'up' | 'down' | 'neutral';
    note: string | null;
    samples: {
      wins: number;
      losses: number;
    };
  };
  sessions: {
    active: boolean;
    total: number;
    current_session: {
      id: number;
      started_at: string;
      trades_count: number;
      limits: {
        trades: { current: number; max: number | null; remaining: number | null };
        drawdown: { current: number; max: number | null; remaining: number | null };
        losses: { current: number; max: number | null; remaining: number | null };
        warnings: string[];
      } | null;
    } | null;
  };
  performance_curve: {
    data: {
      date: string;
      equity: number;
      balance: number;
    }[];
    max_drawdown: number;
    max_drawdown_date: string | null;
  };
  balance_history: {
    id: number;
    transaction_type: 'top_up' | 'withdrawal' | 'adjustment';
    amount: number;
    balance_after: number;
    note: string | null;
    created_at: string;
  }[];
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  createBalanceTransaction: async (payload: { transaction_type: string, amount: number, created_at?: string, note?: string }) => {
    const response = await api.post('/balance_transactions', { balance_transaction: payload });
    return response.data;
  }
};
