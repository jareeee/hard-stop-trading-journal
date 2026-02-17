import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, TrendingUp, TrendingDown, Calendar, Play } from 'lucide-react';
import { tradeService } from '../services/trade';
import { sessionService, type SessionData } from '../services/session';
import type { Strategy } from '../services/strategy';

export const TradeLog = () => {
  const navigate = useNavigate();

  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [asset, setAsset] = useState('BTCUSDT');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [datetime, setDatetime] = useState('');
  const [strategyId, setStrategyId] = useState('');
  const [notes, setNotes] = useState('');

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [stats, setStats] = useState({
    trades_taken: 0,
    wins: 0,
    losses: 0,
    current_drawdown: 0
  });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    calculateWarnings();
  }, [entryPrice, stopLoss, targetPrice, strategyId, stats.trades_taken, currentSession?.rule?.max_trades_per_session]);

  const loadInitialData = async () => {
    try {
      setSessionLoading(true);
      const session = await sessionService.getCurrent();
      setCurrentSession(session);

      if (session?.strategies && session.strategies.length > 0) {
        const sessionStrategies = session.strategies.map((s) => ({
          id: s.id,
          name: s.name,
          description: undefined,
          is_active: true,
          created_at: new Date().toISOString()
        }));
        setStrategies(sessionStrategies);
      } else {
        setStrategies([]);
      }

      const statsData = await tradeService.getStats();
      setStats(statsData);
    } catch {
      setError('Failed to load trade log data.');
    } finally {
      setSessionLoading(false);
    }
  };

  const calculateWarnings = () => {
    const nextWarnings: string[] = [];
    const entry = Number(entryPrice);
    const stop = Number(stopLoss);
    const target = Number(targetPrice);

    if (entry > 0 && stop > 0 && target > 0) {
      const risk = Math.abs(entry - stop);
      const reward = Math.abs(target - entry);
      const ratio = reward / risk;
      if (ratio < 2) {
        nextWarnings.push('The risk is bigger than potential reward');
      }
    }

    const maxTrades = currentSession?.rule?.max_trades_per_session;
    if (maxTrades && maxTrades > 0) {
      if (stats.trades_taken >= Math.max(1, maxTrades - 1)) {
        nextWarnings.push('Approaching max trades per session');
      }
    }

    if (entry > 0 && stop > 0) {
      const riskPercent = Math.abs((stop - entry) / entry) * 100;
      if (riskPercent > 2) {
        nextWarnings.push('Stop loss exceeded recommended risk');
      }
    }

    setWarnings(nextWarnings);
  };

  const calculateRiskReward = () => {
    const entry = Number(entryPrice);
    const stop = Number(stopLoss);
    const target = Number(targetPrice);

    if (!(entry > 0 && stop > 0 && target > 0)) return '0:0';

    const risk = Math.abs(entry - stop);
    const reward = Math.abs(target - entry);
    const ratio = reward / risk;

    return `${ratio.toFixed(1).startsWith('2') ? '2' : ratio.toFixed(0)}:1`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentSession) {
      setError('No active session. Please start a session first.');
      return;
    }

    const strategyRequired = Boolean(currentSession.rule?.enforce_strategy);

    if (!asset.trim()) {
      setError('Asset is required.');
      return;
    }

    if (!entryPrice || Number(entryPrice) <= 0) {
      setError('Entry price must be greater than 0.');
      return;
    }

    if (stopLoss && Number(stopLoss) <= 0) {
      setError('Stop loss must be greater than 0.');
      return;
    }

    if (targetPrice && Number(targetPrice) <= 0) {
      setError('Target price must be greater than 0.');
      return;
    }

    if (strategyRequired && !strategyId) {
      setError('Strategy selection is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await tradeService.create({
        trade: {
          asset: asset.toUpperCase().replace(/\//g, ''),
          direction,
          entry_price: Number(entryPrice),
          stop_loss: stopLoss ? Number(stopLoss) : undefined,
          target_price: targetPrice ? Number(targetPrice) : undefined,
          strategy_id: strategyId ? parseInt(strategyId, 10) : undefined,
          notes: notes || undefined,
          quantity: quantity ? Number(quantity) : undefined
        }
      });

      setAsset('BTCUSDT');
      setTargetPrice('');
      setStopLoss('');
      setEntryPrice('');
      setQuantity('');
      setDatetime('');
      setStrategyId('');
      setNotes('');

      await loadInitialData();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('Session expired. Please login again.');
      } else if (status === 403) {
        setError('No active session. Please start a new session first.');
      } else if (status === 422) {
        const errors = err?.response?.data?.errors;
        if (Array.isArray(errors) && errors.length > 0) {
          setError(errors[0]);
        } else {
          setError(err?.response?.data?.error || 'Trade data is invalid.');
        }
      } else {
        setError('Failed to log trade. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="trade-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Checking session status...</p>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="trade-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="no-session-message">
          <div className="no-session-icon">
            <Play size={48} />
          </div>
          <h2 className="no-session-title">No Active Session</h2>
          <p className="no-session-text">
            You need to start a trading session before you can log trades.
          </p>
          <button
            className="btn-start-session-prompt"
            onClick={() => navigate('/session')}
          >
            <Play size={20} />
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  const strategyRequired = Boolean(currentSession.rule?.enforce_strategy);

  return (
    <div className="trade-container">
      <div className="trade-form-section">
        <div className="form-header">
          <TrendingUp size={24} color="#e5e5e5" />
          <h2 style={{ fontSize: '1.25rem', color: '#e5e5e5', fontWeight: '500' }}>New Trade Entry</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">Direction</label>
            <div className="direction-toggle">
              <button
                type="button"
                className={`btn-direction ${direction === 'long' ? 'active long' : ''}`}
                onClick={() => setDirection('long')}
              >
                <TrendingUp size={16} />
                Long
              </button>
              <button
                type="button"
                className={`btn-direction ${direction === 'short' ? 'active short' : ''}`}
                onClick={() => setDirection('short')}
              >
                <TrendingDown size={16} />
                Short
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="input-label">Trading pair</label>
              <input
                type="text"
                className="input-field"
                value={asset}
                onChange={(e) => setAsset(e.target.value.toUpperCase().replace(/\//g, ''))}
                placeholder="BTCUSDT"
                required
              />
            </div>
            <div className="form-group">
              <label className="input-label">Target price</label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label className="input-label">Stop loss</label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label className="input-label">Date/Time</label>
              <div className="input-field-wrapper">
                <input
                  type="text"
                  className="input-field"
                  value={datetime}
                  placeholder="26/01/2026, 19:58"
                  onChange={(e) => setDatetime(e.target.value)}
                />
                <Calendar className="input-icon" size={18} />
              </div>
            </div>
            <div className="form-group">
              <label className="input-label">Quantity</label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label className="input-label">Entry price</label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
            <label className="input-label">
              Strategy {strategyRequired ? <span style={{ color: '#ef4444' }}>*</span> : ''}
            </label>
            <select
              className="input-field"
              value={strategyId}
              onChange={(e) => setStrategyId(e.target.value)}
              required={strategyRequired}
            >
              <option value="">Select strategy</option>
              {strategies.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </option>
              ))}
            </select>
            {strategyRequired && !strategyId && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Strategy selection is required
              </p>
            )}
          </div>

          <div className="form-group full-width" style={{ marginTop: '1.5rem', borderTop: '1px solid #1a1a1a', paddingTop: '1.5rem' }}>
            <label className="input-label">Notes</label>
            <textarea
              className="input-field"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add Notes"
              style={{ minHeight: '180px' }}
            />
          </div>

          <button
            type="submit"
            className="btn-trade"
            disabled={loading || (strategyRequired && !strategyId)}
          >
            {loading ? 'Logging Trade...' : 'Trade'}
          </button>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '1rem', textAlign: 'center' }}>
              {error}
            </p>
          )}
        </form>
      </div>

      <div className="trade-stats-section">
        <div className="stats-card">
          <div className="stats-header">
            <Shield size={18} color="#737373" />
            <span style={{ fontSize: '1rem', color: '#e5e5e5' }}>Stats Today</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Trades taken</span>
            <span className="stat-value" style={{ fontSize: '1.1rem' }}>{stats.trades_taken}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Wins / Losses</span>
            <span className="stat-value" style={{ fontSize: '1.1rem' }}>{stats.wins} / {stats.losses}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Current drawdown</span>
            <span className="stat-value" style={{ fontSize: '1.1rem' }}>{stats.current_drawdown.toFixed(1)}%</span>
          </div>
        </div>

        <div className="risk-card">
          <h3 style={{ fontSize: '0.9rem', color: '#e5e5e5', marginBottom: '1rem', fontWeight: '500' }}>Risk/Reward Ratio</h3>
          <div className="risk-badge">
            {calculateRiskReward()}
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-header" style={{ marginBottom: '1.5rem' }}>
            <AlertTriangle size={18} color="#ef4444" />
            <span style={{ fontSize: '1rem', color: '#e5e5e5' }}>Warnings</span>
          </div>

          <div className="flex-col gap-2">
            {warnings.length === 0 ? (
              <p style={{ color: '#737373', fontSize: '0.85rem' }}>No warnings</p>
            ) : (
              warnings.map((warning, index) => (
                <div key={index} className="warning-item" style={{ background: '#1a1010', border: '1px solid #2d1a1a', padding: '1rem' }}>
                  <AlertTriangle size={16} color="#ef4444" />
                  <span style={{ color: '#a3a3a3', fontSize: '0.85rem' }}>{warning}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
