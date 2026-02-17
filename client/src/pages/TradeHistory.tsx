import { useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { AlertTriangle, BarChart3, CalendarDays, ChevronDown, ChevronUp, TrendingDown, TrendingUp } from 'lucide-react';
import { sessionService, type SessionTrade } from '../services/session';
import { tradeService } from '../services/trade';

type TradeSession = {
  id: number;
  status: 'active' | 'ended';
  started_at: string;
  ended_at?: string;
  trades: SessionTrade[];
};

type RawSessionResource = {
  id?: string;
  attributes?: {
    status?: string;
    started_at?: string;
    ended_at?: string | null;
    trades?: unknown[];
  };
};

type RawTradeResource = {
  id?: string;
  attributes?: {
    asset?: string;
    direction?: string;
    entry_price?: number | string;
    stop_loss?: number | string | null;
    target_price?: number | string | null;
    close_price?: number | string | null;
    risk_percent?: number | string | null;
    pnl_gross?: number | string | null;
    pnl_net?: number | string | null;
    fee?: number | string | null;
    result?: string | null;
    opened_at?: string;
    closed_at?: string | null;
  };
  relationships?: {
    session?: { data?: { id?: string } | null };
  };
};

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toInteger = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
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

const normalizeTrade = (value: unknown): SessionTrade | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const raw = value as Record<string, unknown>;
  const id = toInteger(raw.id);
  const asset = typeof raw.asset === 'string' ? raw.asset : null;
  const openedAt = typeof raw.opened_at === 'string' ? raw.opened_at : null;
  if (id === null || asset === null || openedAt === null) {
    return null;
  }
  const direction = raw.direction === 'short' ? 'short' : 'long';
  let strategy: SessionTrade['strategy'];
  if (raw.strategy && typeof raw.strategy === 'object') {
    const strategyRecord = raw.strategy as Record<string, unknown>;
    const strategyId = toInteger(strategyRecord.id);
    const strategyName = typeof strategyRecord.name === 'string' ? strategyRecord.name : null;
    if (strategyId !== null && strategyName) {
      strategy = { id: strategyId, name: strategyName };
    }
  }
  return {
    id,
    asset,
    direction,
    entry_price: String(raw.entry_price ?? ''),
    stop_loss: raw.stop_loss == null ? undefined : String(raw.stop_loss),
    target_price: raw.target_price == null ? undefined : String(raw.target_price),
    close_price: raw.close_price == null ? undefined : String(raw.close_price),
    risk_percent: raw.risk_percent == null ? undefined : String(raw.risk_percent),
    pnl_gross: raw.pnl_gross == null ? undefined : String(raw.pnl_gross),
    pnl_net: raw.pnl_net == null ? undefined : String(raw.pnl_net),
    fee: raw.fee == null ? undefined : String(raw.fee),
    result: typeof raw.result === 'string' ? raw.result : undefined,
    opened_at: openedAt,
    closed_at: typeof raw.closed_at === 'string' ? raw.closed_at : undefined,
    strategy
  };
};

const buildSessionsFromSessionsPayload = (payload: unknown): TradeSession[] => {
  const data = (payload as { data?: unknown })?.data;
  if (!Array.isArray(data)) {
    return [];
  }
  const sessions = (data as RawSessionResource[]).reduce<TradeSession[]>((acc, rawSession) => {
    const id = toInteger(rawSession.id);
    const startedAt = rawSession.attributes?.started_at;
    if (id === null || !startedAt) {
      return acc;
    }
    const trades = Array.isArray(rawSession.attributes?.trades)
      ? rawSession.attributes?.trades.map(normalizeTrade).filter((trade): trade is SessionTrade => trade !== null)
      : [];
    trades.sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
    acc.push({
      id,
      status: rawSession.attributes?.status === 'active' ? 'active' : 'ended',
      started_at: startedAt,
      ended_at: rawSession.attributes?.ended_at || undefined,
      trades
    });
    return acc;
  }, []);
  sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  return sessions;
};

const buildSessionsFromTradesPayload = (payload: unknown): TradeSession[] => {
  const data = (payload as { data?: unknown })?.data;
  if (!Array.isArray(data)) {
    return [];
  }
  const grouped = new Map<number, TradeSession>();
  (data as RawTradeResource[]).forEach((rawTrade) => {
    const sessionId = toInteger(rawTrade.relationships?.session?.data?.id);
    const tradeId = toInteger(rawTrade.id);
    const openedAt = rawTrade.attributes?.opened_at;
    if (sessionId === null || tradeId === null || !openedAt) {
      return;
    }
    const direction = rawTrade.attributes?.direction === 'short' ? 'short' : 'long';
    const trade: SessionTrade = {
      id: tradeId,
      asset: rawTrade.attributes?.asset || '-',
      direction,
      entry_price: String(rawTrade.attributes?.entry_price ?? ''),
      stop_loss: rawTrade.attributes?.stop_loss == null ? undefined : String(rawTrade.attributes.stop_loss),
      target_price: rawTrade.attributes?.target_price == null ? undefined : String(rawTrade.attributes.target_price),
      close_price: rawTrade.attributes?.close_price == null ? undefined : String(rawTrade.attributes.close_price),
      risk_percent: rawTrade.attributes?.risk_percent == null ? undefined : String(rawTrade.attributes.risk_percent),
      pnl_gross: rawTrade.attributes?.pnl_gross == null ? undefined : String(rawTrade.attributes.pnl_gross),
      pnl_net: rawTrade.attributes?.pnl_net == null ? undefined : String(rawTrade.attributes.pnl_net),
      fee: rawTrade.attributes?.fee == null ? undefined : String(rawTrade.attributes.fee),
      result: typeof rawTrade.attributes?.result === 'string' ? rawTrade.attributes.result : undefined,
      opened_at: openedAt,
      closed_at: typeof rawTrade.attributes?.closed_at === 'string' ? rawTrade.attributes.closed_at : undefined
    };
    const existing = grouped.get(sessionId);
    if (!existing) {
      grouped.set(sessionId, {
        id: sessionId,
        status: 'ended',
        started_at: openedAt,
        trades: [trade]
      });
      return;
    }
    existing.trades.push(trade);
    if (new Date(openedAt).getTime() < new Date(existing.started_at).getTime()) {
      existing.started_at = openedAt;
    }
  });
  const sessions = Array.from(grouped.values());
  sessions.forEach((session) => {
    session.trades.sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
  });
  sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  return sessions;
};

const extractErrorMessage = (error: unknown) => {
  const status = (error as AxiosError)?.response?.status;
  if (status === 401) {
    return 'Session expired. Please log in again.';
  }
  if (status === 403) {
    return 'Access denied for trade history.';
  }
  if (status === 500) {
    return 'Trade history service is unavailable right now.';
  }
  return 'Failed to load trade history';
};

export const TradeHistory = () => {
  const [sessions, setSessions] = useState<TradeSession[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const applySessions = (items: TradeSession[]) => {
    setSessions(items);
    setExpandedSessionId((current) => {
      if (current && items.some((session) => session.id === current)) {
        return current;
      }
      return items[0]?.id ?? null;
    });
  };

  const loadSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const sessionsPayload = await sessionService.getAll();
      const parsed = buildSessionsFromSessionsPayload(sessionsPayload);
      applySessions(parsed);
      return;
    } catch (primaryError) {
      try {
        const tradesPayload = await tradeService.getAll();
        const parsedFallback = buildSessionsFromTradesPayload(tradesPayload);
        applySessions(parsedFallback);
        return;
      } catch (fallbackError) {
        setSessions([]);
        setExpandedSessionId(null);
        setError(extractErrorMessage(fallbackError ?? primaryError));
      }
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
    <div className="session-container trade-history-page">
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
                  <span className="trade-history-session-main">
                    <span className="trade-history-session-label">Session #{session.id}</span>
                    <span className="trade-history-session-date">{formatDateTime(session.started_at)}</span>
                  </span>
                  <span className="trade-history-session-meta">
                    <span className={`session-status-badge ${session.status === 'active' ? 'active' : ''}`}>
                      {statusText}
                    </span>
                    <span className="trade-history-session-count">{session.trades.length} trades</span>
                    <span className="trade-history-chevron">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </span>
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
