import { useState, useEffect } from 'react';
import { Activity, Shield, AlertTriangle, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { tradeService } from '../services/trade';
import { strategyService } from '../services/strategy';
import { sessionService } from '../services/session';
import type { Strategy } from '../services/strategy';

export const TradeLog = () => {
    // Form states
    const [direction, setDirection] = useState<'long' | 'short'>('long');
    const [asset, setAsset] = useState('BTCUSDT');
    const [targetPrice, setTargetPrice] = useState('');
    const [stopLoss, setStopLoss] = useState('');
    const [entryPrice, setEntryPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [datetime, setDatetime] = useState('');
    const [strategyId, setStrategyId] = useState('');
    const [notes, setNotes] = useState('');
    
    // Data states
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
        loadInitialData();
    }, []);

    useEffect(() => {
        calculateWarnings();
    }, [entryPrice, stopLoss, targetPrice, strategyId, stats.trades_taken]);

    const loadInitialData = async () => {
        try {
            // Load strategies
            const stratResponse = await strategyService.getAll();
            if (stratResponse.data) {
                setStrategies(stratResponse.data.filter((s: Strategy) => s.is_active));
            }

            // Load stats
            const statsData = await tradeService.getStats();
            setStats(statsData);

            // Ensure there's an active session
            const currentSession = await sessionService.getCurrent();
            if (!currentSession) {
                await sessionService.create();
            }
        } catch (err) {
            console.error('Failed to load initial data:', err);
        }
    };

    const calculateWarnings = () => {
        const newWarnings: string[] = [];

        // Check risk/reward ratio
        const entry = parseFloat(entryPrice);
        const stop = parseFloat(stopLoss);
        const target = parseFloat(targetPrice);

        if (entry && stop && target) {
            const risk = Math.abs(entry - stop);
            const reward = Math.abs(target - entry);
            const ratio = reward / risk;

            if (ratio < 2) {
                newWarnings.push('The risk is bigger than potential reward');
            }
        }

        // Check max trades per session
        if (stats.trades_taken >= 7) { // Matching image count
            newWarnings.push('Approaching max trades per session');
        }

        // Check stop loss exceeded recommended risk
        if (entry && stop) {
            const riskPercent = Math.abs((stop - entry) / entry) * 100;
            if (riskPercent > 2) {
                newWarnings.push('Stop loss exceeded recommended risk');
            }
        }

        setWarnings(newWarnings);
    };

    const calculateRiskReward = () => {
        const entry = parseFloat(entryPrice);
        const stop = parseFloat(stopLoss);
        const target = parseFloat(targetPrice);

        if (!entry || !stop || !target) return '0:0';

        const risk = Math.abs(entry - stop);
        const reward = Math.abs(target - entry);
        const ratio = reward / risk;

        return `${ratio.toFixed(1).startsWith('2') ? '2' : ratio.toFixed(0)}:1`; 
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await tradeService.create({
                trade: {
                    asset,
                    direction,
                    entry_price: parseFloat(entryPrice),
                    stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
                    target_price: targetPrice ? parseFloat(targetPrice) : undefined,
                    quantity: quantity ? parseFloat(quantity) : undefined,
                    strategy_id: strategyId ? parseInt(strategyId) : undefined,
                    notes: notes || undefined
                }
            });

            // Reset form
            setAsset('BTCUSDT');
            setTargetPrice('');
            setStopLoss('');
            setEntryPrice('');
            setQuantity('');
            setStrategyId('');
            setNotes('');

            // Reload stats
            const statsData = await tradeService.getStats();
            setStats(statsData);
        } catch (err: any) {
            console.error('Failed to create trade:', err);
            setError('Failed to log trade. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="trade-container">
            {/* Left Column: Form */}
            <div className="trade-form-section">
                <div className="form-header">
                    <Activity size={24} color="#e5e5e5" />
                    <h2 style={{ fontSize: '1.25rem', color: '#e5e5e5', fontWeight: '500' }}>New Trade Entry</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Direction */}
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

                    {/* Row 1: Pair, Target, Stop */}
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

                    {/* Row 2: Date, Quantity, Entry Price */}
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

                    {/* Strategy */}
                    <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
                        <label className="input-label">
                            Strategy <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                            className="input-field"
                            value={strategyId}
                            onChange={(e) => setStrategyId(e.target.value)}
                            required
                        >
                            <option value="">Select strategy</option>
                            {strategies.map(strategy => (
                                <option key={strategy.id} value={strategy.id}>
                                    {strategy.name}
                                </option>
                            ))}
                        </select>
                        {!strategyId && (
                            <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                Strategy selection is required
                            </p>
                        )}
                    </div>

                    {/* Notes */}
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
                        disabled={loading || !strategyId}
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

            {/* Right Column: Stats & Sidebars */}
            <div className="trade-stats-section">
                {/* Stats Today Card */}
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

                {/* Risk/Reward Card */}
                <div className="risk-card">
                    <h3 style={{ fontSize: '0.9rem', color: '#e5e5e5', marginBottom: '1rem', fontWeight: '500' }}>Risk/Reward Ratio</h3>
                    <div className="risk-badge">
                        {calculateRiskReward()}
                    </div>
                </div>

                {/* Warnings Card */}
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
