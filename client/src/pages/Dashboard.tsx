import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, type DashboardStats } from '../services/dashboard';
import { AlertTriangle, TrendingUp, TrendingDown, BarChart2, Wallet, History, Plus, ScrollText } from 'lucide-react';

export const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [balanceForm, setBalanceForm] = useState({
        transaction_type: 'top_up',
        amount: '',
        created_at: new Date().toISOString().split('T')[0],
        note: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchStats();
    }, [navigate]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await dashboardService.getStats();
            setStats(data);
        } catch (err: any) {
            // Check if it's an authentication error
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }
            setError(err.response?.data?.error || err.message || 'Failed to load dashboard stats');
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBalanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await dashboardService.createBalanceTransaction({
                transaction_type: balanceForm.transaction_type,
                amount: parseFloat(balanceForm.amount),
                created_at: balanceForm.created_at,
                note: balanceForm.note
            });
            setShowBalanceModal(false);
            setBalanceForm({
                transaction_type: 'top_up',
                amount: '',
                created_at: new Date().toISOString().split('T')[0],
                note: ''
            });
            fetchStats(); // Refresh data
        } catch (err: any) {
            alert(err.response?.data?.errors?.join(', ') || err.message || 'Failed to update balance');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Trading Dashboard</h1>
                        <p className="dashboard-subtitle">Monitoring risk management and behavioral discipline</p>
                    </div>
                </div>
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-header">
                    <div>
                        <h1 className="dashboard-title">Trading Dashboard</h1>
                        <p className="dashboard-subtitle">Monitoring risk management and behavioral discipline</p>
                    </div>
                </div>
                <div className="error-state">
                    <p className="error-message">
                        <AlertTriangle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                        {error || 'Failed to load dashboard'}
                    </p>
                    <button onClick={fetchStats} className="btn-retry">Retry</button>
                </div>
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const getPercentColor = (percent: number) => {
        if (percent > 0) return 'var(--color-success)';
        if (percent < 0) return 'var(--color-danger)';
        return 'var(--color-text-secondary)';
    };

    // Calculate chart dimensions
    const chartWidth = 800;
    const chartHeight = 300;
    const padding = { top: 20, right: 30, bottom: 40, left: 60 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    // Get min and max values for scaling
    const equityValues = stats.performance_curve.data.map(d => Number(d.equity));
    const minEquity = Math.min(...equityValues);
    const maxEquity = Math.max(...equityValues);
    const equityRange = maxEquity - minEquity || 100;

    // Scale functions
    const scaleX = (index: number) => {
        return (index / (stats.performance_curve.data.length - 1 || 1)) * innerWidth;
    };

    const scaleY = (value: number) => {
        return innerHeight - ((value - minEquity) / equityRange) * innerHeight;
    };

    // Generate path for equity curve
    const equityPath = stats.performance_curve.data
        .map((point, index) => {
            const x = scaleX(index);
            const y = scaleY(Number(point.equity));
            return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
        })
        .join(' ');

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Trading Dashboard</h1>
                    <p className="dashboard-subtitle">Monitoring risk management and behavioral discipline</p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid">
                {/* Account Balance */}
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">NET P&L</span>
                    </div>
                    <div className="metric-value" style={{ color: getPercentColor(stats.account_balance.pnl) }}>
                        {stats.account_balance.pnl >= 0 ? '+' : ''}{formatCurrency(stats.account_balance.pnl)}
                    </div>
                    <div className="metric-footer">
                        <span style={{ color: getPercentColor(stats.account_balance.pnl_percent) }}>
                            {stats.account_balance.pnl_percent >= 0 ? '+' : ''}{stats.account_balance.pnl_percent}% vs start
                        </span>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ 
                                    width: `${Math.min(Math.abs(stats.account_balance.pnl_percent), 100)}%`,
                                    backgroundColor: getPercentColor(stats.account_balance.pnl_percent)
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Profit Factor */}
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">PROFIT FACTOR</span>
                    </div>
                    <div className="metric-value">
                        {Number(stats.profit_factor.value).toFixed(2)}
                    </div>
                    <div className="metric-footer">
                        <span>Optimal: &gt;{Number(stats.profit_factor.optimal).toFixed(1)}</span>
                        <span style={{ color: 'var(--color-primary)' }}>
                            {stats.profit_factor.percent_of_target}% of Target
                        </span>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ 
                                    width: `${Math.min(stats.profit_factor.percent_of_target, 100)}%`,
                                    backgroundColor: 'var(--color-primary)'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Realized Risk/Reward */}
                <div className="metric-card">
                    <div className="metric-header">
                        <span className="metric-label">REALIZED RISK:REWARD</span>
                    </div>
                    <div className="metric-value">
                        1:{Number(stats.realized_risk_reward.value).toFixed(1)}
                    </div>
                    <div className="metric-footer">
                        <span className={stats.realized_risk_reward.status === 'up' ? 'trend-up' : 'trend-down'}>
                            {stats.realized_risk_reward.status === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {' '}
                            {stats.realized_risk_reward.status === 'up' ? 'Up' : 'Down'} {Math.abs(stats.realized_risk_reward.deviation_percent)}% from historical average
                        </span>
                    </div>
                </div>
            </div>

            {/* Sessions & Performance Row */}
            <div className="dashboard-row">
                {/* Sessions Info */}
                <div className="card sessions-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="icon-badge"><BarChart2 size={18} /></span>
                            Sessions
                        </h3>
                        {stats.sessions.active ? (
                            <span className="live-badge">
                                <span className="pulse-dot"></span>
                                LIVE SESSION
                            </span>
                        ) : (
                            <span className="inactive-badge">
                                SESSION NOT ACTIVE
                            </span>
                        )}
                    </div>
                    <div className="sessions-content">
                        {stats.sessions.current_session && stats.sessions.current_session.limits && (
                            <div className="session-limits">
                                <div className="limit-item">
                                    <span className="limit-label">Remaining Trades</span>
                                    <span className={`limit-value ${stats.sessions.current_session.limits.trades.remaining !== null && stats.sessions.current_session.limits.trades.remaining <= 1 ? 'danger' : ''}`}>
                                        {stats.sessions.current_session.limits.trades.current} / {stats.sessions.current_session.limits.trades.max ?? 'All'}
                                    </span>
                                </div>
                                <div className="limit-item">
                                    <span className="limit-label">Total Drawdown</span>
                                    <span className={`limit-value ${stats.sessions.current_session.limits.drawdown.remaining !== null && Number(stats.sessions.current_session.limits.drawdown.remaining) <= 0.5 ? 'danger' : ''}`}>
                                        {Number(stats.sessions.current_session.limits.drawdown.current).toFixed(2)}% / {stats.sessions.current_session.limits.drawdown.max ?? 'All'}%
                                    </span>
                                </div>
                                <div className="limit-item">
                                    <span className="limit-label">Consecutive Losses</span>
                                    <span className={`limit-value ${stats.sessions.current_session.limits.losses.remaining !== null && stats.sessions.current_session.limits.losses.remaining === 0 ? 'danger' : ''}`}>
                                        {stats.sessions.current_session.limits.losses.current} / {stats.sessions.current_session.limits.losses.max ?? 'All'}
                                    </span>
                                </div>

                                {stats.sessions.current_session.limits.warnings.length > 0 && (
                                    <div className="session-warnings">
                                        {stats.sessions.current_session.limits.warnings.map((warning, i) => (
                                            <div key={i} className="warning-msg">
                                                <AlertTriangle size={14} style={{ marginRight: '6px' }} />
                                                {warning}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {!stats.sessions.active && (
                            <div className="no-session">
                                <p>Session not active</p>
                                <button className="btn-primary btn-sm">Start Session</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance Summary */}
                <div className="card performance-summary-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="icon-badge"><Wallet size={18} /></span>
                            Account Summary
                        </h3>
                        <div className="card-actions">
                            <button 
                                className="btn-secondary btn-sm"
                                onClick={() => setShowHistoryModal(true)}
                                style={{ marginRight: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <History size={14} /> View Log
                            </button>
                            <button 
                                className="btn-primary btn-sm"
                                onClick={() => setShowBalanceModal(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Plus size={14} /> Manage Balance
                            </button>
                        </div>
                    </div>
                    <div className="performance-summary">
                        <div className="summary-item">
                            <span className="summary-label">Current Balance</span>
                            <span className="summary-value">{formatCurrency(stats.account_balance.current)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Starting Balance</span>
                            <span className="summary-value">{formatCurrency(stats.account_balance.starting)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Max Drawdown</span>
                            <span className="summary-value" style={{ color: 'var(--color-danger)' }}>
                                -{Number(stats.performance_curve.max_drawdown).toFixed(2)}%
                            </span>
                        </div>
                        {stats.performance_curve.max_drawdown_date && (
                            <div className="summary-note">
                                Max DD on {formatDate(stats.performance_curve.max_drawdown_date)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance Curve */}
            <div className="card chart-card full-width">
                <div className="card-header">
                    <h3 className="card-title">Performance Curve</h3>
                    <div className="chart-legend">
                        <div className="legend-item">
                            <span className="legend-dot" style={{ backgroundColor: 'var(--color-primary)' }}></span>
                            <span>EQUITY</span>
                        </div>
                    </div>
                </div>
                <div className="chart-container">
                    <svg width={innerWidth + padding.left + padding.right} height={chartHeight} className="performance-chart">
                        <g transform={`translate(${padding.left}, ${padding.top})`}>
                            {/* Grid lines */}
                            <g className="grid">
                                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                                    const y = innerHeight * ratio;
                                    const value = maxEquity - (equityRange * ratio);
                                    return (
                                        <g key={ratio}>
                                            <line x1={0} y1={y} x2={innerWidth} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                            <text x={-10} y={y} textAnchor="end" alignmentBaseline="middle" fill="var(--color-text-tertiary)" fontSize="11">
                                                ${value.toFixed(0)}
                                            </text>
                                        </g>
                                    );
                                })}
                            </g>
                            <path d={equityPath} fill="none" stroke="var(--color-primary)" strokeWidth="3" />
                            <path d={`${equityPath} L ${innerWidth},${innerHeight} L 0,${innerHeight} Z`} fill="url(#gradient)" opacity="0.1" />
                            
                            {/* X-axis labels */}
                            <g className="x-axis">
                                {stats.performance_curve.data
                                    .filter((_, i) => i % Math.ceil(stats.performance_curve.data.length / 8) === 0)
                                    .map((point, i) => {
                                        const originalIndex = stats.performance_curve.data.indexOf(point);
                                        return (
                                            <text key={i} x={scaleX(originalIndex)} y={innerHeight + 25} textAnchor="middle" fill="var(--color-text-tertiary)" fontSize="11">
                                                {formatDate(point.date)}
                                            </text>
                                        );
                                    })}
                            </g>
                        </g>
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0 }} />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>

            {/* Balance Modal */}
            {showBalanceModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">Manage Balance</h2>
                            <button className="close-btn" onClick={() => setShowBalanceModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleBalanceSubmit} className="modal-form">
                            <div className="form-group">
                                <label className="input-label">Transaction Type</label>
                                <div className="type-toggle">
                                    <button 
                                        type="button"
                                        className={`type-btn ${balanceForm.transaction_type === 'top_up' ? 'active deposit' : ''}`}
                                        onClick={() => setBalanceForm({ ...balanceForm, transaction_type: 'top_up' })}
                                    >
                                        Deposit
                                    </button>
                                    <button 
                                        type="button"
                                        className={`type-btn ${balanceForm.transaction_type === 'withdrawal' ? 'active withdraw' : ''}`}
                                        onClick={() => setBalanceForm({ ...balanceForm, transaction_type: 'withdrawal' })}
                                    >
                                        Withdraw
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="input-label">Date</label>
                                <input 
                                    type="date" 
                                    className="input-field" 
                                    required
                                    value={balanceForm.created_at}
                                    onChange={(e) => setBalanceForm({ ...balanceForm, created_at: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Amount (USD)</label>
                                <input 
                                    type="number" 
                                    className="input-field" 
                                    placeholder="0.00"
                                    step="0.01"
                                    required
                                    value={balanceForm.amount}
                                    onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="input-label">Note (Optional)</label>
                                <input 
                                    type="text" 
                                    className="input-field" 
                                    placeholder="Reason for adjustment..."
                                    value={balanceForm.note}
                                    onChange={(e) => setBalanceForm({ ...balanceForm, note: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn-secondary"
                                    onClick={() => setShowBalanceModal(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Processing...' : 'Confirm Transaction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Balance History Modal */}
            {showHistoryModal && (
                <div className="modal-overlay">
                    <div className="modal-content history-modal">
                        <div className="modal-header">
                            <h2 className="modal-title">
                                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <ScrollText size={24} color="var(--color-primary)" />
                                    Balance History
                                </span>
                            </h2>
                            <button className="close-btn" onClick={() => setShowHistoryModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="log-content">
                                {stats.balance_history.length > 0 ? (
                                    <div className="transaction-list">
                                        {stats.balance_history.map((tx) => (
                                            <div key={tx.id} className="transaction-item">
                                                <div className="tx-info">
                                                    <span className={`tx-type ${tx.transaction_type}`}>
                                                        {tx.transaction_type === 'top_up' ? 'Deposit' : 
                                                         tx.transaction_type === 'withdrawal' ? 'Withdraw' : 'Adj'}
                                                    </span>
                                                    <span className="tx-date">{formatDate(tx.created_at)}</span>
                                                </div>
                                                <div className="tx-amount-group">
                                                    <span className={`tx-amount ${tx.transaction_type === 'top_up' ? 'positive' : 'negative'}`}>
                                                        {tx.transaction_type === 'top_up' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                    </span>
                                                    <span className="tx-balance">New Bal: {formatCurrency(tx.balance_after)}</span>
                                                </div>
                                                {tx.note && <div className="tx-note">{tx.note}</div>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-data">No transactions recorded yet</div>
                                )}
                            </div>
                        </div>
                        <div className="modal-actions full-width">
                            <button 
                                className="btn-secondary" 
                                onClick={() => setShowHistoryModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
