import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Target, AlertTriangle } from 'lucide-react';
import { ruleService } from '../services/rule';
import { strategyService } from '../services/strategy';
import type { Strategy } from '../services/strategy';

export const RuleConfiguration = () => {
    const navigate = useNavigate();
    
    // Rule states
    const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState(2);
    const [maxDrawdownPercent, setMaxDrawdownPercent] = useState(5);
    const [maxTrades, setMaxTrades] = useState(10);
    const [maxTradesPerHour, setMaxTradesPerHour] = useState(2);
    const [riskRewardRatio, setRiskRewardRatio] = useState(3);
    const [enforceStrategy, setEnforceStrategy] = useState(true);
    
    // Strategy states
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [newStrategy, setNewStrategy] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStrategies();
    }, []);

    const loadStrategies = async () => {
        try {
            const response = await strategyService.getAll();
            console.log('Strategies API response:', response);
            
            if (response.data) {
                // Parse JSONAPI format: response.data is array of { id, type, attributes }
                const parsedStrategies = response.data.map((s: any) => ({
                    id: parseInt(s.id),
                    name: s.attributes.name,
                    description: s.attributes.description,
                    is_active: s.attributes.is_active,
                    created_at: s.attributes.created_at
                }));
                
                console.log('Parsed strategies:', parsedStrategies);
                setStrategies(parsedStrategies);
            }
        } catch (err) {
            console.error('Failed to load strategies:', err);
        }
    };

    const toggleStrategy = async (id: number) => {
        const strategy = strategies.find(s => s.id === id);
        if (!strategy) return;

        try {
            await strategyService.update(id, {
                strategy: {
                    name: strategy.name,
                    is_active: !strategy.is_active
                }
            });
            setStrategies(strategies.map(s => 
                s.id === id ? { ...s, is_active: !s.is_active } : s
            ));
        } catch (err) {
            console.error('Failed to update strategy:', err);
        }
    };

    const addStrategy = async () => {
        if (!newStrategy.trim()) return;
        
        try {
            const response = await strategyService.create({
                strategy: {
                    name: newStrategy,
                    is_active: true
                }
            });
            
            if (response.data) {
                // Parse JSONAPI format
                const newStrategyData = {
                    id: parseInt(response.data.id),
                    name: response.data.attributes.name,
                    description: response.data.attributes.description,
                    is_active: response.data.attributes.is_active,
                    created_at: response.data.attributes.created_at
                };
                
                setStrategies([...strategies, newStrategyData]);
                setNewStrategy('');
            }
        } catch (err) {
            console.error('Failed to add strategy:', err);
        }
    };

    const handleSaveRules = async () => {
        setLoading(true);
        setError('');

        try {
            await ruleService.create({
                rule: {
                    max_consecutive_losses: maxConsecutiveLosses,
                    max_daily_drawdown_percent: maxDrawdownPercent,
                    max_trades_per_session: maxTrades,
                    max_trades_per_hour: maxTradesPerHour,
                    enforce_strategy: enforceStrategy
                }
            });

            navigate('/dashboard');
        } catch (err: any) {
            console.error('Failed to save rules:', err);
            setError('Failed to save rules. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetDefaults = () => {
        setMaxConsecutiveLosses(2);
        setMaxDrawdownPercent(5);
        setMaxTrades(10);
        setMaxTradesPerHour(2);
        setRiskRewardRatio(3);
        setEnforceStrategy(true);
    };

    return (
        <div className="onboarding-container" style={{ maxWidth: '700px' }}>
            <div className="rule-header">
                <div style={{ 
                    padding: '8px', 
                    border: '1px solid #333', 
                    borderRadius: '8px',
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #000 100%)'
                }}>
                    <Target size={24} color="#dc2626" />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Rule Configuration</h1>
                    <p style={{ fontSize: '0.875rem' }}>Define your trading discipline parameters</p>
                </div>
            </div>

            {error && (
                <div style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            {/* Loss Limits */}
            <div className="onboarding-card">
                <div className="section-title">
                    <ShieldAlert size={18} color="#dc2626" />
                    <span>Loss Limits</span>
                </div>
                
                <div className="rule-input-group">
                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                        Maximum consecutive losing trades
                    </label>
                    <div className="number-input-wrapper">
                        <input 
                            type="number" 
                            className="number-input" 
                            value={maxConsecutiveLosses}
                            onChange={(e) => setMaxConsecutiveLosses(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <p className="hint-text">Warning triggers after this many consecutive losses</p>
                </div>

                <div className="rule-input-group">
                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                        Maximum drawdown (%)
                    </label>
                    <div className="number-input-wrapper">
                        <input 
                            type="number" 
                            className="number-input" 
                            value={maxDrawdownPercent}
                            onChange={(e) => setMaxDrawdownPercent(parseInt(e.target.value) || 0)}
                        />
                        <span>%</span>
                    </div>
                    <p className="hint-text">Warning triggers when daily loss exceeds this percentage</p>
                </div>
            </div>

            {/* Behavior Control */}
            <div className="onboarding-card">
                <div className="section-title">
                    <ShieldCheck size={18} color="#dc2626" />
                    <span>Behavior Control</span>
                </div>

                <div className="rule-input-group">
                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                        Maximum trades
                    </label>
                    <input 
                        type="number" 
                        className="number-input" 
                        value={maxTrades}
                        onChange={(e) => setMaxTrades(parseInt(e.target.value) || 0)}
                        style={{ width: '100px' }} 
                    />
                    <p className="hint-text">Hard limit on total trades in a session</p>
                </div>

                <div className="rule-input-group">
                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                        Maximum trades within 1-hour window
                    </label>
                    <input 
                        type="number" 
                        className="number-input" 
                        value={maxTradesPerHour}
                        onChange={(e) => setMaxTradesPerHour(parseInt(e.target.value) || 0)}
                        style={{ width: '100px' }} 
                    />
                    <p className="hint-text">Prevents overtrading in short timeframes</p>
                </div>

                <div className="rule-input-group">
                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                        Ratio Risk/Reward
                    </label>
                    <div className="number-input-wrapper">
                        <span>1 : </span>
                        <input 
                            type="number" 
                            className="number-input" 
                            value={riskRewardRatio}
                            onChange={(e) => setRiskRewardRatio(parseInt(e.target.value) || 0)}
                            style={{ width: '60px' }} 
                        />
                    </div>
                    <p className="hint-text">Warn me if trade R:R is less than 1 : {riskRewardRatio}</p>
                </div>
            </div>

            {/* Strategy Discipline */}
            <div className="onboarding-card">
                <div className="section-title">
                    <Target size={18} color="#dc2626" />
                    <span>Strategy Discipline</span>
                </div>

                <label className="checkbox-container" style={{ marginBottom: '1.5rem' }}>
                    <input 
                        type="checkbox" 
                        checked={enforceStrategy}
                        onChange={(e) => setEnforceStrategy(e.target.checked)}
                    />
                    <div>
                        <div style={{ color: 'white' }}>Require strategy selection for every trade</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Forces deliberate strategy classification before execution</div>
                    </div>
                </label>

                <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Add strategy</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <input 
                            type="text" 
                            className="input-field" 
                            placeholder="e.g. NY Open Breakout" 
                            value={newStrategy}
                            onChange={(e) => setNewStrategy(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addStrategy()}
                        />
                        <button className="btn-secondary" onClick={addStrategy} style={{ padding: '0 1.5rem' }}>Save</button>
                    </div>

                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Your strategies</label>
                    {strategies.length === 0 ? (
                        <p className="hint-text">No strategies yet. Add your first strategy above.</p>
                    ) : (
                        strategies.map(strategy => (
                            <div key={strategy.id} className="strategy-row">
                                <input 
                                    type="checkbox" 
                                    checked={strategy.is_active} 
                                    onChange={() => toggleStrategy(strategy.id)}
                                    style={{ width: '1.25rem', height: '1.25rem' }}
                                />
                                <span>{strategy.name}</span>
                            </div>
                        ))
                    )}
                    <p className="hint-text" style={{ marginTop: '0.5rem' }}>Enable strategies you plan to use in sessions</p>

                    <div className="commitment-box" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                        <AlertTriangle className="warning-icon" size={18} />
                        <p style={{ fontSize: '0.875rem' }}>Trades without a strategy will be flagged</p>
                    </div>
                </div>
            </div>

            <div className="action-bar">
                <button 
                    className="btn-primary" 
                    style={{ flex: 4, opacity: loading ? 0.7 : 1 }} 
                    onClick={handleSaveRules}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Rules'}
                </button>
                <button 
                    className="btn-secondary" 
                    style={{ flex: 1 }} 
                    onClick={handleResetDefaults}
                    disabled={loading}
                >
                    Reset to Defaults
                </button>
            </div>

            <p style={{ opacity: 0.5, fontSize: '0.75rem', textAlign: 'center', marginBottom: '2rem' }}>
                Rules can be updated later in Preferences. Changes apply to future sessions.
            </p>
        </div>
    );
};
