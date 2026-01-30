import api from '../api/axios';

export interface Session {
  id: number;
  status: 'active' | 'ended';
  started_at: string;
  ended_at?: string;
  trade_count?: number;
}

export const sessionService = {
  create: async () => {
    const response = await api.post('/sessions', {});
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/sessions');
    return response.data;
  },

  getCurrent: async () => {
    const response = await api.get('/sessions');
    const sessions = response.data?.data || [];
    return sessions.find((s: any) => s.attributes?.status === 'active');
  },

  end: async (id: number) => {
    const response = await api.put(`/sessions/${id}`, {
      session: {
        status: 'ended',
        ended_at: new Date().toISOString()
      }
    });
    return response.data;
  }
};
