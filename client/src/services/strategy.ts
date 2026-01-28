import api from '../api/axios';

export interface Strategy {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface StrategyPayload {
  strategy: {
    name: string;
    description?: string;
    is_active?: boolean;
  }
}

export const strategyService = {
  create: async (payload: StrategyPayload) => {
    const response = await api.post('/strategies', payload);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/strategies');
    return response.data;
  },

  update: async (id: number, payload: StrategyPayload) => {
    const response = await api.put(`/strategies/${id}`, payload);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/strategies/${id}`);
    return response.data;
  }
};
