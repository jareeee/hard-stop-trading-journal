import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Target, 
  TrendingDown,
  TrendingUp,
  Zap,
  ArrowRight,
  XCircle,
  X,
  Plus,
  BarChart3,
  History
} from 'lucide-react';
import { sessionService, type SessionData, type SessionStats } from '../services/session';
import { ruleService, type Rule } from '../services/rule';
import { strategyService, type Strategy } from '../services/strategy';
import { tradeService } from '../services/trade';

// Step types for the wizard
type WizardStep = 'overview' | 'rules' | 'confirmation' | 'active';

export const Session = () => {
  const navigate = useNavigate();
  
  // Session State
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [pastSessions, setPastSessions] = useState<SessionData[]>([]);
  
  // Wizard State
  const [step, setStep] = useState<WizardStep>('overview');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Rule Configuration State
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<number[]>([]);
  
  // Custom Rule State (for inline creation)
  const [showCustomRule, setShowCustomRule] = useState(false);
  const [customRule, setCustomRule] = useState({
    max_consecutive_losses: 2,
    max_daily_drawdown_percent: 5,
    max_trades_per_session: 10,
    enforce_strategy: true
  });
  
  // Confirmation checkbox
  const [confirmed, setConfirmed] = useState(false);

  // Trade Management State
  const [selectedTradeForClose, setSelectedTradeForClose] = useState<number | null>(null);
  const [closePrice, setClosePrice] = useState('');
  const [closingTrade, setClosingTrade] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [sessionRes, rulesRes, strategiesRes] = await Promise.all([
        sessionService.getAll(),
        ruleService.getAll(),
        strategyService.getAll()
      ]);

      // Parse sessions
      const sessions = sessionRes?.data || [];
      const activeSession = sessions.find((s: any) => s.attributes?.status === 'active');
      const ended = sessions.filter((s: any) => s.attributes?.status === 'ended');
      
      if (activeSession) {
        const sessionData: SessionData = {
          id: parseInt(activeSession.id),
          status: activeSession.attributes.status,
          started_at: activeSession.attributes.started_at,
          ended_at: activeSession.attributes.ended_at,
          trade_count: activeSession.attributes.trade_count || 0,
          rule: activeSession.attributes.rule,
          strategies: activeSession.attributes.strategies || [],
          trades: activeSession.attributes.trades || []
        };
        setCurrentSession(sessionData);
        setStep('active');
        
        // Load session stats
        await loadSessionStats(sessionData.id);
      }
      
      setPastSessions(ended.slice(0, 5).map((s: any) => ({
        id: parseInt(s.id),
        status: s.attributes.status,
        started_at: s.attributes.started_at,
        ended_at: s.attributes.ended_at,
        trade_count: s.attributes.trade_count || 0
      })));

      // Parse rules
      if (rulesRes?.data) {
        const parsedRules = rulesRes.data.map((r: any) => ({
          id: parseInt(r.id),
          ...r.attributes
        }));
        setRules(parsedRules);
        if (parsedRules.length > 0) {
          setSelectedRuleId(parsedRules[0].id);
        }
      }

      // Parse strategies
      if (strategiesRes?.data) {
        const parsedStrategies = strategiesRes.data.map((s: any) => ({
          id: s.id,
          name: s.attributes.name,
          is_active: s.attributes.is_active
        }));
        setStrategies(parsedStrategies);
        setSelectedStrategies(parsedStrategies.filter((s: Strategy) => s.is_active).map((s: Strategy) => s.id));
      }

    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionStats = async (sessionId: number) => {
    try {
      const stats = await sessionService.getStats(sessionId);
      setSessionStats(stats);
    } catch (err) {
      console.error('Failed to load session stats:', err);
    }
  };

  const handleStartSession = async () => {
    if (!confirmed) {
      setError('Please confirm you have read and agreed to the session rules');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      let ruleId = selectedRuleId;
      
      // If using custom rule, create it first
      if (showCustomRule) {
        const ruleRes = await ruleService.create({ rule: customRule });
        ruleId = ruleRes.data?.id ? parseInt(ruleRes.data.id) : null;
      }

      const response = await sessionService.create(ruleId, selectedStrategies);
      
      if (response?.data) {
        const session = response.data;
        setCurrentSession({
          id: parseInt(session.id),
          status: session.attributes.status,
          started_at: session.attributes.started_at,
          trade_count: 0,
          rule: session.attributes.rule,
          strategies: session.attributes.strategies || [],
          trades: session.attributes.trades || []
        });
        setStep('active');
        await loadSessionStats(parseInt(session.id));
      }
    } catch (err: any) {
      console.error('Failed to start session:', err);
      setError(err.response?.data?.error || 'Failed to start session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndSession = async () => {
    if (!currentSession) return;

    try {
      setSubmitting(true);
      await sessionService.end(currentSession.id);
      setCurrentSession(null);
      setSessionStats(null);
      setStep('overview');
      setConfirmed(false);
      await loadInitialData();
    } catch (err: any) {
      console.error('Failed to end session:', err);
      setError('Failed to end session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCloseTradeModal = (tradeId: number) => {
    setSelectedTradeForClose(tradeId);
    setClosePrice('');
  };

  const handleCloseModal = () => {
    setSelectedTradeForClose(null);
    setClosePrice('');
  };

  const handleCloseTrade = async () => {
    if (!closePrice || !selectedTradeForClose || !currentSession) return;

    try {
      setClosingTrade(true);
      await tradeService.update(selectedTradeForClose, {
        trade: {
          close_price: parseFloat(closePrice),
          closed_at: new Date().toISOString()
        } as any
      });

      // Reload session data to get updated trades
      const sessions = await sessionService.getAll();
      const activeSession = sessions?.data?.find((s: any) => s.attributes?.status === 'active');
      
      if (activeSession) {
        setCurrentSession({
          id: parseInt(activeSession.id),
          status: activeSession.attributes.status,
          started_at: activeSession.attributes.started_at,
          ended_at: activeSession.attributes.ended_at,
          trade_count: activeSession.attributes.trade_count || 0,
          rule: activeSession.attributes.rule,
          strategies: activeSession.attributes.strategies || [],
          trades: activeSession.attributes.trades || []
        });
      }

      // Close modal and reload stats
      handleCloseModal();
      await loadSessionStats(currentSession.id);
    } catch (err) {
      console.error('Failed to close trade:', err);
      setError('Failed to close trade');
    } finally {
      setClosingTrade(false);
    }
  };

  const handleLogTrade = () => {
    navigate('/trade-history');
  };

  const getSelectedRule = (): Rule | null => {
    if (showCustomRule) {
      return {
        id: 0,
        ...customRule,
        created_at: new Date().toISOString()
      };
    }
    return rules.find(r => r.id === selectedRuleId) || null;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startStr: string, endStr?: string) => {
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="session-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  // Active Session View
  if (step === 'active' && currentSession) {
    return (
      <div className="session-container">
        <div className="session-header">
          <div className="session-header-info">
            <div className="session-status-badge active">
              <span className="pulse-dot"></span>
              LIVE SESSION
            </div>
            <h1 className="session-title">Trading Session</h1>
            <p className="session-subtitle">
              Started {formatDate(currentSession.started_at)} • Duration: {formatDuration(currentSession.started_at)}
            </p>
          </div>
        </div>

        {/* Session Stats Grid */}
        <div className="session-stats-grid">
          <div className="session-stat-card">
            <div className="stat-icon trades">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Trades Taken</span>
              <div className="stat-value-row">
                <span className="stat-main-value">{sessionStats?.trades.current || 0}</span>
                {sessionStats?.trades.max && (
                  <span className="stat-limit">/ {sessionStats.trades.max}</span>
                )}
              </div>
              {sessionStats?.trades.remaining !== null && sessionStats?.trades.remaining !== undefined && (
                <div className="stat-remaining">
                  {sessionStats.trades.remaining} remaining
                </div>
              )}
            </div>
          </div>

          <div className="session-stat-card">
            <div className="stat-icon drawdown">
              <TrendingDown size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Current Drawdown</span>
              <div className="stat-value-row">
                <span className={`stat-main-value ${(sessionStats?.drawdown.current || 0) > 0 ? 'danger' : ''}`}>
                  {(sessionStats?.drawdown.current || 0).toFixed(2)}%
                </span>
                {sessionStats?.drawdown.max && (
                  <span className="stat-limit">/ {sessionStats.drawdown.max}%</span>
                )}
              </div>
              {sessionStats?.drawdown.remaining !== null && sessionStats?.drawdown.remaining !== undefined && (
                <div className="stat-remaining">
                  {sessionStats.drawdown.remaining}% buffer left
                </div>
              )}
            </div>
          </div>

          <div className="session-stat-card">
            <div className="stat-icon losses">
              <XCircle size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Consecutive Losses</span>
              <div className="stat-value-row">
                <span className={`stat-main-value ${(sessionStats?.losses.current || 0) >= (sessionStats?.losses.max || 999) - 1 ? 'danger' : ''}`}>
                  {sessionStats?.losses.current || 0}
                </span>
                {sessionStats?.losses.max && (
                  <span className="stat-limit">/ {sessionStats.losses.max}</span>
                )}
              </div>
              {sessionStats?.losses.remaining !== null && sessionStats?.losses.remaining !== undefined && (
                <div className="stat-remaining">
                  {sessionStats.losses.remaining} before limit
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warnings */}
        {sessionStats?.warnings && sessionStats.warnings.length > 0 && (
          <div className="session-warnings-container">
            <div className="warnings-header">
              <AlertTriangle size={18} />
              <span>Active Warnings</span>
            </div>
            <div className="warnings-list">
              {sessionStats.warnings.map((warning, idx) => (
                <div key={idx} className="warning-item-card">
                  <AlertTriangle size={16} />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Rules Summary */}
        {currentSession.rule && (
          <div className="session-rules-card">
            <div className="rules-header">
              <Shield size={20} />
              <span>Active Rules</span>
            </div>
            <div className="rules-grid">
              {currentSession.rule.max_trades_per_session && (
                <div className="rule-item">
                  <span className="rule-label">Max Trades</span>
                  <span className="rule-value">{currentSession.rule.max_trades_per_session}</span>
                </div>
              )}
              {currentSession.rule.max_daily_drawdown_percent && (
                <div className="rule-item">
                  <span className="rule-label">Max Drawdown</span>
                  <span className="rule-value">{currentSession.rule.max_daily_drawdown_percent}%</span>
                </div>
              )}
              {currentSession.rule.max_consecutive_losses && (
                <div className="rule-item">
                  <span className="rule-label">Max Losses</span>
                  <span className="rule-value">{currentSession.rule.max_consecutive_losses}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trades List */}
        {currentSession.trades && currentSession.trades.length > 0 && (
          <div className="session-trades-card">
            <div className="trades-header">
              <BarChart3 size={20} />
              <span>Session Trades ({currentSession.trades.length})</span>
            </div>
            <div className="trades-list">
              {currentSession.trades.map((trade) => {
                const isClosed = !!trade.close_price;
                
                return (
                  <div 
                    key={trade.id} 
                    className={`trade-item ${!isClosed ? 'clickable' : ''}`}
                    onClick={() => !isClosed && handleOpenCloseTradeModal(trade.id)}
                    style={{ cursor: isClosed ? 'default' : 'pointer' }}
                  >
                    <div className="trade-item-header">
                      <div className="trade-asset-direction">
                        {trade.direction === 'long' ? (
                          <TrendingUp size={18} color="#10b981" />
                        ) : (
                          <TrendingDown size={18} color="#ef4444" />
                        )}
                        <span className="trade-asset">{trade.asset}</span>
                        <span className={`trade-direction ${trade.direction}`}>
                          {trade.direction.toUpperCase()}
                        </span>
                        {isClosed && (
                          <span className="trade-closed-badge">CLOSED</span>
                        )}
                      </div>
                      {trade.strategy && (
                        <span className="trade-strategy-badge">{trade.strategy.name}</span>
                      )}
                    </div>
                    
                    <div className="trade-item-details">
                      <div className="trade-detail-row">
                        <span className="trade-detail-label">Entry:</span>
                        <span className="trade-detail-value">${parseFloat(trade.entry_price).toLocaleString()}</span>
                      </div>
                      {trade.stop_loss && (
                        <div className="trade-detail-row">
                          <span className="trade-detail-label">Stop Loss:</span>
                          <span className="trade-detail-value">${parseFloat(trade.stop_loss).toLocaleString()}</span>
                        </div>
                      )}
                      {trade.target_price && (
                        <div className="trade-detail-row">
                          <span className="trade-detail-label">Target:</span>
                          <span className="trade-detail-value">${parseFloat(trade.target_price).toLocaleString()}</span>
                        </div>
                      )}
                      {trade.close_price && (
                        <div className="trade-detail-row">
                          <span className="trade-detail-label">Close:</span>
                          <span className="trade-detail-value">${parseFloat(trade.close_price).toLocaleString()}</span>
                        </div>
                      )}
                      {trade.pnl_net && (
                        <div className="trade-detail-row">
                          <span className="trade-detail-label">P&L:</span>
                          <span className={`trade-detail-value ${parseFloat(trade.pnl_net) >= 0 ? 'profit' : 'loss'}`}>
                            ${parseFloat(trade.pnl_net).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="trade-item-footer">
                      <span className="trade-timestamp">
                        {new Date(trade.opened_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {trade.result && (
                        <span className={`trade-result ${trade.result}`}>
                          {trade.result}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="session-actions">
          <button 
            className="btn-session-action primary"
            onClick={handleLogTrade}
          >
            <History size={20} />
            Trade History
          </button>
          <button 
            className="btn-session-action danger"
            onClick={handleEndSession}
            disabled={submitting}
          >
            <XCircle size={20} />
            {submitting ? 'Ending...' : 'End Session'}
          </button>
        </div>

        {error && (
          <div className="session-error">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Close Trade Modal */}
        {selectedTradeForClose && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Close Trade</h3>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="modal-body">
                {currentSession.trades?.find(t => t.id === selectedTradeForClose) && (() => {
                  const trade = currentSession.trades.find(t => t.id === selectedTradeForClose)!;
                  return (
                    <div className="trade-summary">
                      <div className="trade-summary-row">
                        <span className="label">Asset:</span>
                        <span className="value">{trade.asset}</span>
                      </div>
                      <div className="trade-summary-row">
                        <span className="label">Direction:</span>
                        <span className={`value ${trade.direction}`}>
                          {trade.direction.toUpperCase()}
                        </span>
                      </div>
                      <div className="trade-summary-row">
                        <span className="label">Entry Price:</span>
                        <span className="value">${parseFloat(trade.entry_price).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="modal-input-group">
                  <label className="input-label">Close Price *</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    placeholder="Enter close price"
                    value={closePrice}
                    onChange={(e) => setClosePrice(e.target.value)}
                    disabled={closingTrade}
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn-secondary" 
                  onClick={handleCloseModal}
                  disabled={closingTrade}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleCloseTrade}
                  disabled={!closePrice || closingTrade}
                >
                  {closingTrade ? 'Closing...' : 'Close Trade'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Session Setup Wizard
  return (
    <div className="session-container">
      {/* Progress Steps */}
      <div className="wizard-progress">
        <div className={`progress-step ${step === 'overview' ? 'active' : ''} ${['rules', 'confirmation'].includes(step) ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <span>Overview</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step === 'rules' ? 'active' : ''} ${step === 'confirmation' ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <span>Rules</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step === 'confirmation' ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span>Confirm</span>
        </div>
      </div>

      {/* Step 1: Overview */}
      {step === 'overview' && (
        <>
          <div className="session-header">
            <div className="session-icon-wrapper">
              <Play size={32} />
            </div>
            <h1 className="session-title">Start New Session</h1>
            <p className="session-subtitle">
              A session groups your trades and enforces your discipline rules
            </p>
          </div>

          <div className="info-cards-grid">
            <div className="info-card">
              <div className="info-card-icon">
                <Shield size={24} />
              </div>
              <h3>Rule Enforcement</h3>
              <p>Your session will track limits on trades, drawdown, and consecutive losses</p>
            </div>

            <div className="info-card">
              <div className="info-card-icon">
                <Target size={24} />
              </div>
              <h3>Strategy Focus</h3>
              <p>Lock in which strategies you'll use to maintain consistency</p>
            </div>

            <div className="info-card">
              <div className="info-card-icon">
                <Clock size={24} />
              </div>
              <h3>Real-time Tracking</h3>
              <p>Get warnings before you hit your limits to protect your capital</p>
            </div>
          </div>

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <div className="past-sessions-card">
              <div className="past-sessions-header">
                <History size={18} />
                <span>Recent Sessions</span>
              </div>
              <div className="past-sessions-list">
                {pastSessions.slice(0, 3).map(session => (
                  <div key={session.id} className="past-session-item">
                    <div className="past-session-info">
                      <span className="past-session-date">{formatDate(session.started_at)}</span>
                      <span className="past-session-trades">{session.trade_count} trades</span>
                    </div>
                    <span className="past-session-duration">
                      {formatDuration(session.started_at, session.ended_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            className="btn-wizard-next"
            onClick={() => setStep('rules')}
          >
            Configure Rules
            <ArrowRight size={20} />
          </button>
        </>
      )}

      {/* Step 2: Rules Selection */}
      {step === 'rules' && (
        <>
          <div className="session-header">
            <div className="session-icon-wrapper">
              <Shield size={32} />
            </div>
            <h1 className="session-title">Session Rules</h1>
            <p className="session-subtitle">
              Select or customize the rules for this session
            </p>
          </div>

          {/* Existing Rules Selection */}
          {rules.length > 0 && !showCustomRule && (
            <div className="rules-selection-card">
              <h3 className="selection-title">Select a Rule Preset</h3>
              <div className="rules-options">
                {rules.map(rule => (
                  <div 
                    key={rule.id}
                    className={`rule-option ${selectedRuleId === rule.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRuleId(rule.id)}
                  >
                    <div className="rule-option-header">
                      <CheckCircle2 size={20} className="check-icon" />
                      <span className="rule-option-title">Rule #{rule.id}</span>
                    </div>
                    <div className="rule-option-details">
                      {rule.max_trades_per_session && (
                        <span>{rule.max_trades_per_session} max trades</span>
                      )}
                      {rule.max_daily_drawdown_percent && (
                        <span>{rule.max_daily_drawdown_percent}% max DD</span>
                      )}
                      {rule.max_consecutive_losses && (
                        <span>{rule.max_consecutive_losses} max losses</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                className="btn-custom-rule"
                onClick={() => setShowCustomRule(true)}
              >
                <Plus size={16} />
                Create Custom Rule
              </button>
            </div>
          )}

          {/* Custom Rule Form */}
          {(showCustomRule || rules.length === 0) && (
            <div className="custom-rule-card">
              <h3 className="selection-title">
                {rules.length > 0 ? 'Custom Rule' : 'Configure Session Rules'}
              </h3>
              
              <div className="custom-rule-form">
                <div className="rule-form-group">
                  <label>Maximum Trades per Session</label>
                  <input 
                    type="number"
                    className="input-field"
                    value={customRule.max_trades_per_session}
                    onChange={(e) => setCustomRule({
                      ...customRule,
                      max_trades_per_session: parseInt(e.target.value) || 0
                    })}
                    min={1}
                  />
                  <span className="form-hint">Hard limit on total trades</span>
                </div>

                <div className="rule-form-group">
                  <label>Maximum Daily Drawdown (%)</label>
                  <input 
                    type="number"
                    className="input-field"
                    value={customRule.max_daily_drawdown_percent}
                    onChange={(e) => setCustomRule({
                      ...customRule,
                      max_daily_drawdown_percent: parseInt(e.target.value) || 0
                    })}
                    min={1}
                    max={100}
                  />
                  <span className="form-hint">Stop trading when drawdown exceeds this</span>
                </div>

                <div className="rule-form-group">
                  <label>Maximum Consecutive Losses</label>
                  <input 
                    type="number"
                    className="input-field"
                    value={customRule.max_consecutive_losses}
                    onChange={(e) => setCustomRule({
                      ...customRule,
                      max_consecutive_losses: parseInt(e.target.value) || 0
                    })}
                    min={1}
                  />
                  <span className="form-hint">Warning after this many losses in a row</span>
                </div>

                <label className="checkbox-container">
                  <input 
                    type="checkbox"
                    checked={customRule.enforce_strategy}
                    onChange={(e) => setCustomRule({
                      ...customRule,
                      enforce_strategy: e.target.checked
                    })}
                  />
                  <span>Require strategy selection for every trade</span>
                </label>
              </div>

              {rules.length > 0 && (
                <button 
                  className="btn-back-to-presets"
                  onClick={() => setShowCustomRule(false)}
                >
                  Back to Presets
                </button>
              )}
            </div>
          )}

          {/* Strategy Selection */}
          {strategies.length > 0 && (
            <div className="strategy-selection-card">
              <h3 className="selection-title">Available Strategies</h3>
              <p className="selection-subtitle">Select strategies you plan to use this session</p>
              
              <div className="strategy-options">
                {strategies.map(strategy => (
                  <label key={strategy.id} className="strategy-option">
                    <input 
                      type="checkbox"
                      checked={selectedStrategies.includes(strategy.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStrategies([...selectedStrategies, strategy.id]);
                        } else {
                          setSelectedStrategies(selectedStrategies.filter(id => id !== strategy.id));
                        }
                      }}
                    />
                    <span className="strategy-name">{strategy.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="wizard-actions">
            <button 
              className="btn-wizard-back"
              onClick={() => setStep('overview')}
            >
              Back
            </button>
            <button 
              className="btn-wizard-next"
              onClick={() => setStep('confirmation')}
            >
              Continue
              <ArrowRight size={20} />
            </button>
          </div>
        </>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirmation' && (
        <>
          <div className="session-header">
            <div className="session-icon-wrapper success">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="session-title">Confirm Session</h1>
            <p className="session-subtitle">
              Review your session configuration before starting
            </p>
          </div>

          <div className="confirmation-card">
            <h3 className="confirmation-title">Session Rules</h3>
            
            <div className="confirmation-rules">
              {(() => {
                const rule = getSelectedRule();
                if (!rule) return <p>No rules configured</p>;
                return (
                  <>
                    <div className="confirmation-rule-item">
                      <Zap size={18} />
                      <span>Maximum <strong>{rule.max_trades_per_session}</strong> trades per session</span>
                    </div>
                    <div className="confirmation-rule-item">
                      <TrendingDown size={18} />
                      <span>Stop at <strong>{rule.max_daily_drawdown_percent}%</strong> daily drawdown</span>
                    </div>
                    <div className="confirmation-rule-item">
                      <AlertTriangle size={18} />
                      <span>Max <strong>{rule.max_consecutive_losses}</strong> consecutive losses</span>
                    </div>
                    {rule.enforce_strategy && (
                      <div className="confirmation-rule-item">
                        <Target size={18} />
                        <span>Strategy required for each trade</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {selectedStrategies.length > 0 && (
              <>
                <h3 className="confirmation-title" style={{ marginTop: '1.5rem' }}>Selected Strategies</h3>
                <div className="confirmation-strategies">
                  {strategies.filter(s => selectedStrategies.includes(s.id)).map(s => (
                    <span key={s.id} className="strategy-badge">{s.name}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="commitment-card">
            <div className="commitment-icon">
              <Shield size={24} />
            </div>
            <div className="commitment-content">
              <h4>Trading Discipline Commitment</h4>
              <p>
                By starting this session, I commit to following my rules. I understand that 
                breaking these limits can harm my account and trading psychology.
              </p>
              <label className="confirmation-checkbox">
                <input 
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>I understand and agree to follow these rules</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="session-error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <div className="wizard-actions">
            <button 
              className="btn-wizard-back"
              onClick={() => setStep('rules')}
            >
              Back
            </button>
            <button 
              className="btn-start-session"
              onClick={handleStartSession}
              disabled={!confirmed || submitting}
            >
              {submitting ? (
                <>
                  <div className="spinner-small"></div>
                  Starting Session...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Start Trading Session
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
