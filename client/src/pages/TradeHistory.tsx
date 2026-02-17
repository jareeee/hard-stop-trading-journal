import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CalendarDays, ChevronDown, ChevronUp, TrendingDown, TrendingUp } from 'lucide-react';
import { sessionService, type SessionTrade } from '../services/session';

type TradeSession = {
  id: number;
  status: 'active' | 'ended';
  started_at: string;
  ended_at?: string;
  trades: SessionTrade[];
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const formatPrice = (value: unknown) => {
  const parsed = toNumber(value);
  if (parsed === null) {
    return '-';
  }
  return `$${parsed.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
};

export const TradeHistory = () => {
  const [sessions, setSessions] = useState<TradeSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await sessionService.getAll();
      const rawSessions = Array.isArray(response?.data)
        ? (response.data as Array<{
            id?: string;
            attributes?: {
              status?: string;
              started_at?: string;
              ended_at?: string | null;
              trades?: SessionTrade[];
            };
          }>)
        : [];
      const parsedSessions = rawSessions.reduce<TradeSession[]>((acc, raw) => {
        const attributes = raw.attributes || {};
        const id = Number.parseInt(raw.id || '', 10);
        const startedAt = attributes.started_at;
        if (!Number.isInteger(id) || !startedAt) {
          return acc;
        }
        acc.push({
          id,
          status: attributes.status === 'active' ? 'active' : 'ended',
          started_at: startedAt,
          ended_at: attributes.ended_at || undefined,
          trades: Array.isArray(attributes.trades) ? attributes.trades : []
        });
        return acc;
      }, []);
      parsedSessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
      setSessions(parsedSessions);
      setExpandedSessionId((current) => {
        if (current && parsedSessions.some((session) => session.id === current)) {
          return current;
        }
        return parsedSessions[0]?.id ?? null;
      });
    } catch {
      setError('Failed to load trade history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const totals = useMemo(() => {
    return sessions.reduce(
      (acc, session) => {
        acc.trades += session.trades.length;
        session.trades.forEach((trade) => {
          if (trade.result === 'win') {
            acc.wins += 1;
          }
          if (trade.result === 'loss') {
            acc.losses += 1;
          }
        });
        return acc;
      },
      { trades: 0, wins: 0, losses: 0 }
    );
  }, [sessions]);

  if (loading) {
    return (
      <div className="session-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading trade history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="session-container">
      <div className="session-header">
        <div className="session-header-info">
          <h1 className="session-title">Trade History</h1>
          <p className="session-subtitle">All trades grouped by session</p>
        </div>
      </div>

      <div className="session-stats-grid">
        <div className="session-stat-card">
          <div className="stat-icon trades">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Trades</span>
            <div className="stat-value-row">
              <span className="stat-main-value">{totals.trades}</span>
            </div>
          </div>
        </div>
        <div className="session-stat-card">
          <div className="stat-icon drawdown">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Wins</span>
            <div className="stat-value-row">
              <span className="stat-main-value">{totals.wins}</span>
            </div>
          </div>
        </div>
        <div className="session-stat-card">
          <div className="stat-icon losses">
            <TrendingDown size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Losses</span>
            <div className="stat-value-row">
              <span className="stat-main-value">{totals.losses}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="session-error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {!error && sessions.length === 0 && (
        <div className="no-session-message">
          <div className="no-session-icon">
            <CalendarDays size={48} />
          </div>
          <h2 className="no-session-title">No trade history yet</h2>
          <p className="no-session-text">Start and complete sessions to build your history.</p>
        </div>
      )}

      {!error && sessions.length > 0 && (
        <div className="trade-history-list">
          {sessions.map((session) => {
            const isExpanded = expandedSessionId === session.id;
            const statusText = session.status === 'active' ? 'ACTIVE' : 'ENDED';
            return (
              <section key={session.id} className="session-trades-card">
                <button
                  type="button"
                  className="trade-history-toggle"
                  onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                  aria-expanded={isExpanded}
                >
                  <span className="trade-history-session-label">Session #{session.id}</span>
                  <span className={`session-status-badge ${session.status === 'active' ? 'active' : ''}`}>
                    {statusText}
                  </span>
                  <span className="trade-history-session-date">{formatDateTime(session.started_at)}</span>
                  <span className="trade-history-session-count">{session.trades.length} trades</span>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {isExpanded && (
                  <>
                    {session.trades.length === 0 ? (
                      <p className="trade-history-empty">No trades in this session.</p>
                    ) : (
                      <div className="trades-list">
                        {session.trades.map((trade) => {
                          const direction = trade.direction === 'short' ? 'short' : 'long';
                          const pnlValue = toNumber(trade.pnl_net);
                          const result = trade.result === 'win' || trade.result === 'loss' || trade.result === 'breakeven' ? trade.result : undefined;
                          return (
                            <div key={trade.id} className="trade-item">
                              <div className="trade-item-header">
                                <div className="trade-asset-direction">
                                  {direction === 'long' ? (
                                    <TrendingUp size={18} color="#10b981" />
                                  ) : (
                                    <TrendingDown size={18} color="#ef4444" />
                                  )}
                                  <span className="trade-asset">{trade.asset}</span>
                                  <span className={`trade-direction ${direction}`}>{direction.toUpperCase()}</span>
                                </div>
                                {trade.strategy?.name && <span className="trade-strategy-badge">{trade.strategy.name}</span>}
                              </div>

                              <div className="trade-item-details">
                                <div className="trade-detail-row">
                                  <span className="trade-detail-label">Entry</span>
                                  <span className="trade-detail-value">{formatPrice(trade.entry_price)}</span>
                                </div>
                                <div className="trade-detail-row">
                                  <span className="trade-detail-label">Stop</span>
                                  <span className="trade-detail-value">{formatPrice(trade.stop_loss)}</span>
                                </div>
                                <div className="trade-detail-row">
                                  <span className="trade-detail-label">Target</span>
                                  <span className="trade-detail-value">{formatPrice(trade.target_price)}</span>
                                </div>
                                <div className="trade-detail-row">
                                  <span className="trade-detail-label">Close</span>
                                  <span className="trade-detail-value">{formatPrice(trade.close_price)}</span>
                                </div>
                                <div className="trade-detail-row">
                                  <span className="trade-detail-label">P&L</span>
                                  <span className={`trade-detail-value ${pnlValue === null ? '' : pnlValue >= 0 ? 'profit' : 'loss'}`}>
                                    {pnlValue === null ? '-' : `$${pnlValue.toLocaleString(undefined, { maximumFractionDigits: 4 })}`}
                                  </span>
                                </div>
                              </div>

                              <div className="trade-item-footer">
                                <span className="trade-timestamp">{formatDateTime(trade.opened_at)}</span>
                                {result && <span className={`trade-result ${result}`}>{result}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
