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
    value: number;
    optimal: number;
    percent_of_target: number;
  };
  realized_risk_reward: {
    value: number;
    historical_avg: number;
    deviation_percent: number;
    status: 'up' | 'down';
  };
  sessions: {
    active: boolean;
    total: number;
    current_session: {
      id: number;
      started_at: string;
      trades_count: number;
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
