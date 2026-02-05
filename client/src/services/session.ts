import api from '../api/axios';

export interface SessionRule {
  id: number;
  max_consecutive_losses?: number;
  max_daily_drawdown_percent?: number;
  max_trades_per_session?: number;
  max_trades_per_hour?: number;
  enforce_strategy?: boolean;
}

export interface SessionTrade {
  id: number;
  asset: string;
  direction: 'long' | 'short';
  entry_price: string;
  stop_loss?: string;
  target_price?: string;
  close_price?: string;
  risk_percent?: string;
  pnl_gross?: string;
  pnl_net?: string;
  fee?: string;
  result?: string;
  opened_at: string;
  closed_at?: string;
  strategy?: { id: number; name: string };
}

export interface SessionData {
  id: number;
  status: 'active' | 'ended';
  started_at: string;
  ended_at?: string;
  trade_count?: number;
  rule?: SessionRule;
  strategies?: Array<{ id: number; name: string }>;
  trades?: SessionTrade[];
}

export interface SessionStats {
  trades: {
    current: number;
    max: number | null;
    remaining: number | null;
  };
  drawdown: {
    current: number;
    max: number | null;
    remaining: number | null;
  };
  losses: {
    current: number;
    max: number | null;
    remaining: number | null;
  };
  warnings: string[];
}

export const sessionService = {
  /**
   * Create a new trading session with optional rule and strategies
   */
  create: async (ruleId?: number | null, strategyIds?: number[]) => {
    const payload: {
      session: {
        rule_id?: number;
        strategy_ids?: number[];
      };
    } = { session: {} };

    if (ruleId) {
      payload.session.rule_id = ruleId;
    }
    if (strategyIds && strategyIds.length > 0) {
      payload.session.strategy_ids = strategyIds;
    }

    const response = await api.post('/sessions', payload);
    return response.data;
  },

  /**
   * Get all sessions for the current user
   */
  getAll: async () => {
    const response = await api.get('/sessions');
    return response.data;
  },

  /**
   * Get a specific session by ID
   */
  getById: async (id: number) => {
    const response = await api.get(`/sessions/${id}`);
    return response.data;
  },

  /**
   * Get the current active session
   */
  getCurrent: async (): Promise<SessionData | null> => {
    const response = await api.get('/sessions');
    const sessions = response.data?.data || [];
    const activeSession = sessions.find((s: any) => s.attributes?.status === 'active');
    
    if (!activeSession) return null;

    return {
      id: parseInt(activeSession.id),
      status: activeSession.attributes.status,
      started_at: activeSession.attributes.started_at,
      ended_at: activeSession.attributes.ended_at,
      trade_count: activeSession.attributes.trade_count || 0,
      rule: activeSession.attributes.rule,
      strategies: activeSession.attributes.strategies || [],
      trades: activeSession.attributes.trades || []
    };
  },

  /**
   * Get stats for an active session
   */
  getStats: async (sessionId: number): Promise<SessionStats> => {
    const response = await api.get(`/sessions/${sessionId}/stats`);
    return response.data;
  },

  /**
   * End a session
   */
  end: async (id: number) => {
    const response = await api.put(`/sessions/${id}`, {
      session: {
        status: 'ended',
        ended_at: new Date().toISOString()
      }
    });
    return response.data;
  },

  /**
   * Check if user has an active session (for blocking trade creation)
   */
  hasActiveSession: async (): Promise<boolean> => {
    const current = await sessionService.getCurrent();
    return current !== null;
  }
};
