import api from '../api/axios';

export interface Trade {
  id: number;
  asset: string;
  direction: 'long' | 'short';
  entry_price: number;
  quantity?: number;
  stop_loss?: number;
  target_price?: number;
  close_price?: number;
  risk_percent?: number;
  pnl_net?: number;
  result?: string;
  opened_at: string;
  closed_at?: string;
  strategy?: {
    id: number;
    name: string;
  };
}

export interface TradePayload {
  trade: {
    asset: string;
    direction: 'long' | 'short';
    entry_price: number;
    quantity?: number;
    stop_loss?: number;
    target_price?: number;
    notes?: string;
    close_price?: number;
    risk_percent?: number;
    strategy_id?: number;
    result?: string;
    closed_at?: string;
  }
}

export interface TradeStats {
  trades_taken: number;
  wins: number;
  losses: number;
  current_drawdown: number;
}

export const tradeService = {
  create: async (payload: TradePayload) => {
    const response = await api.post('/trades', payload);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/trades');
    return response.data;
  },

  update: async (id: number, payload: TradePayload) => {
    const response = await api.put(`/trades/${id}`, payload);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/trades/${id}`);
    return response.data;
  },

  getStats: async (): Promise<TradeStats> => {
    // This would be a dedicated endpoint in production
    const response = await api.get('/trades');
    const trades = response.data?.data || [];
    
    const stats: TradeStats = {
      trades_taken: trades.length,
      wins: trades.filter((t: any) => t.attributes?.result === 'win').length,
      losses: trades.filter((t: any) => t.attributes?.result === 'loss').length,
      current_drawdown: 0 // Would be calculated from actual PnL
    };
    
    return stats;
  }
};
