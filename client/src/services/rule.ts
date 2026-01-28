import api from '../api/axios';

export interface Rule {
  id: number;
  max_consecutive_losses?: number;
  max_daily_drawdown_percent?: number;
  max_trades_per_session?: number;
  max_trades_per_hour?: number;
  cooldown_minutes_after_loss?: number;
  enforce_strategy: boolean;
  created_at: string;
}

export interface RulePayload {
  rule: {
    max_consecutive_losses?: number;
    max_daily_drawdown_percent?: number;
    max_trades_per_session?: number;
    max_trades_per_hour?: number;
    cooldown_minutes_after_loss?: number;
    enforce_strategy?: boolean;
  }
}

export const ruleService = {
  create: async (payload: RulePayload) => {
    const response = await api.post('/rules', payload);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/rules');
    return response.data;
  },

  update: async (id: number, payload: RulePayload) => {
    const response = await api.put(`/rules/${id}`, payload);
    return response.data;
  }
};
