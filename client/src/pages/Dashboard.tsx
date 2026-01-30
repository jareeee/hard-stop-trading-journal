import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService, type DashboardStats } from '../services/dashboard';

export const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
                    <p className="error-message">⚠️ {error || 'Failed to load dashboard'}</p>
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
    const equityValues = stats.performance_curve.data.map(d => d.equity);
    const minEquity = Math.min(...equityValues);
    const maxEquity = Math.max(...equityValues);
    const equityRange = maxEquity - minEquity;

    // Scale functions
    const scaleX = (index: number) => {
        return (index / (stats.performance_curve.data.length - 1)) * innerWidth;
    };

    const scaleY = (value: number) => {
        return innerHeight - ((value - minEquity) / equityRange) * innerHeight;
    };

    // Generate path for equity curve
    const equityPath = stats.performance_curve.data
        .map((point, index) => {
            const x = scaleX(index);
            const y = scaleY(point.equity);
            return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
        })
        .join(' ');

    // Generate path for balance line (baseline)
    const balancePath = stats.performance_curve.data
        .map((_, index) => {
            const x = scaleX(index);
            const y = scaleY(stats.account_balance.starting);
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
                        {stats.profit_factor.value.toFixed(2)}
                    </div>
                    <div className="metric-footer">
                        <span>Optimal: &gt;{stats.profit_factor.optimal.toFixed(1)}</span>
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
                        1:{stats.realized_risk_reward.value.toFixed(1)}
                    </div>
                    <div className="metric-footer">
                        <span className={stats.realized_risk_reward.status === 'up' ? 'trend-up' : 'trend-down'}>
                            {stats.realized_risk_reward.status === 'up' ? '↗' : '↘'} 
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
                            <span className="icon-badge">📊</span>
                            Sessions
                        </h3>
                        {stats.sessions.active && (
                            <span className="live-badge">
                                <span className="pulse-dot"></span>
                                LIVE SESSION
                            </span>
                        )}
                    </div>
                    <div className="sessions-content">
                        <div className="session-stat">
                            <span className="stat-label">Total Sessions</span>
                            <span className="stat-value">{stats.sessions.total}</span>
                        </div>
                        {stats.sessions.current_session && (
                            <>
                                <div className="session-stat">
                                    <span className="stat-label">Current Session</span>
                                    <span className="stat-value">#{stats.sessions.current_session.id}</span>
                                </div>
                                <div className="session-stat">
                                    <span className="stat-label">Trades Today</span>
                                    <span className="stat-value">{stats.sessions.current_session.trades_count}</span>
                                </div>
                                <div className="session-stat">
                                    <span className="stat-label">Started</span>
                                    <span className="stat-value">
                                        {new Date(stats.sessions.current_session.started_at).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </>
                        )}
                        {!stats.sessions.active && (
                            <div className="no-session">
                                <p>No active session</p>
                                <button className="btn-primary btn-sm">Start Session</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance Summary */}
                <div className="card performance-summary-card">
                    <div className="card-header">
                        <h3 className="card-title">
                            <span className="icon-badge">💰</span>
                            Account Summary
                        </h3>
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
                                -{stats.performance_curve.max_drawdown.toFixed(2)}%
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
            <div className="card chart-card">
                <div className="card-header">
                    <h3 className="card-title">Performance Curve</h3>
                    <p className="card-subtitle">Visualizing Equity vs. Balance (Floating Drawdown Focus)</p>
                    <div className="chart-legend">
                        <div className="legend-item">
                            <span className="legend-dot" style={{ backgroundColor: 'var(--color-primary)' }}></span>
                            <span>EQUITY</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot" style={{ backgroundColor: 'var(--color-text-tertiary)' }}></span>
                            <span>BALANCE</span>
                        </div>
                    </div>
                </div>
                <div className="chart-container">
                    <svg width={chartWidth} height={chartHeight} className="performance-chart">
                        <g transform={`translate(${padding.left}, ${padding.top})`}>
                            {/* Grid lines */}
                            <g className="grid">
                                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                                    const y = innerHeight * ratio;
                                    const value = maxEquity - (equityRange * ratio);
                                    return (
                                        <g key={ratio}>
                                            <line
                                                x1={0}
                                                y1={y}
                                                x2={innerWidth}
                                                y2={y}
                                                stroke="rgba(255,255,255,0.05)"
                                                strokeWidth="1"
                                            />
                                            <text
                                                x={-10}
                                                y={y}
                                                textAnchor="end"
                                                alignmentBaseline="middle"
                                                fill="var(--color-text-tertiary)"
                                                fontSize="11"
                                            >
                                                ${value.toFixed(0)}
                                            </text>
                                        </g>
                                    );
                                })}
                            </g>

                            {/* Balance baseline (dashed) */}
                            <path
                                d={balancePath}
                                fill="none"
                                stroke="var(--color-text-tertiary)"
                                strokeWidth="2"
                                strokeDasharray="4 4"
                                opacity="0.5"
                            />

                            {/* Equity curve */}
                            <path
                                d={equityPath}
                                fill="none"
                                stroke="var(--color-primary)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Area under curve */}
                            <path
                                d={`${equityPath} L ${innerWidth},${innerHeight} L 0,${innerHeight} Z`}
                                fill="url(#gradient)"
                                opacity="0.1"
                            />

                            {/* X-axis labels */}
                            <g className="x-axis">
                                {stats.performance_curve.data
                                    .filter((_, i) => i % Math.ceil(stats.performance_curve.data.length / 8) === 0)
                                    .map((point) => {
                                        const originalIndex = stats.performance_curve.data.indexOf(point);
                                        const x = scaleX(originalIndex);
                                        return (
                                            <text
                                                key={originalIndex}
                                                x={x}
                                                y={innerHeight + 20}
                                                textAnchor="middle"
                                                fill="var(--color-text-tertiary)"
                                                fontSize="11"
                                            >
                                                {formatDate(point.date)}
                                            </text>
                                        );
                                    })}
                            </g>

                            {/* Max drawdown indicator */}
                            {stats.performance_curve.max_drawdown > 0 && (
                                <text
                                    x={innerWidth / 2}
                                    y={innerHeight / 2}
                                    textAnchor="middle"
                                    fill="var(--color-danger)"
                                    fontSize="13"
                                    fontWeight="500"
                                    opacity="0.8"
                                >
                                    Max Drawdown: -{stats.performance_curve.max_drawdown.toFixed(2)}%
                                </text>
                            )}
                        </g>

                        {/* Gradient definition */}
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0 }} />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>
        </div>
    );
};
