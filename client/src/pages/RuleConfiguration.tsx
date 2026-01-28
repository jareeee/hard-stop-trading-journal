import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Target, AlertTriangle } from 'lucide-react';

export const RuleConfiguration = () => {
    const navigate = useNavigate();
    const [strategies, setStrategies] = useState([
        { id: 1, name: 'Scalping', active: true },
        { id: 2, name: 'Swing Trading', active: true },
        { id: 3, name: 'Breakout', active: false }
    ]);
    const [newStrategy, setNewStrategy] = useState('');

    const toggleStrategy = (id: number) => {
        setStrategies(strategies.map(s => s.id === id ? { ...s, active: !s.active } : s));
    };

    const addStrategy = () => {
        if (!newStrategy.trim()) return;
        setStrategies([...strategies, { id: Date.now(), name: newStrategy, active: true }]);
        setNewStrategy('');
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
                        <input type="number" className="number-input" defaultValue={2} />
                    </div>
                    <p className="hint-text">Warning triggers after this many consecutive losses</p>
                </div>

                <div className="rule-input-group">
                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                        Maximum drawdown (%)
                    </label>
                    <div className="number-input-wrapper">
                        <input type="number" className="number-input" defaultValue={5} />
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
                    <input type="number" className="number-input" defaultValue={10} style={{ width: '100px' }} />
                    <p className="hint-text">Hard limit on total trades in a session</p>
                </div>

                <div className="rule-input-group">
                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                        Maximum trades within 1-hour window
                    </label>
                    <input type="number" className="number-input" defaultValue={2} style={{ width: '100px' }} />
                    <p className="hint-text">Prevents overtrading in short timeframes</p>
                </div>

                <div className="rule-input-group">
                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                        Ratio Risk/Reward
                    </label>
                    <div className="number-input-wrapper">
                        <span>1 : </span>
                        <input type="number" className="number-input" defaultValue={3} style={{ width: '60px' }} />
                    </div>
                    <p className="hint-text">Warn me if trade R:R is less than 1 : [Input User]</p>
                </div>
            </div>

            {/* Strategy Discipline */}
            <div className="onboarding-card">
                <div className="section-title">
                    <Target size={18} color="#dc2626" />
                    <span>Strategy Discipline</span>
                </div>

                <label className="checkbox-container" style={{ marginBottom: '1.5rem' }}>
                    <input type="checkbox" defaultChecked />
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
                        />
                        <button className="btn-secondary" onClick={addStrategy} style={{ padding: '0 1.5rem' }}>Save</button>
                    </div>

                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Your strategies</label>
                    {strategies.map(strategy => (
                        <div key={strategy.id} className="strategy-row">
                            <input 
                                type="checkbox" 
                                checked={strategy.active} 
                                onChange={() => toggleStrategy(strategy.id)}
                                style={{ width: '1.25rem', height: '1.25rem' }}
                            />
                            <span>{strategy.name}</span>
                        </div>
                    ))}
                    <p className="hint-text" style={{ marginTop: '0.5rem' }}>Enable strategies you plan to use in sessions</p>

                    <div className="commitment-box" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                        <AlertTriangle className="warning-icon" size={18} />
                        <p style={{ fontSize: '0.875rem' }}>Trades without a strategy will be flagged</p>
                    </div>
                </div>
            </div>

            <div className="action-bar">
                <button className="btn-primary" style={{ flex: 4 }} onClick={() => navigate('/dashboard')}>Save Rules</button>
                <button className="btn-secondary" style={{ flex: 1 }}>Reset to Defaults</button>
            </div>

            <p style={{ opacity: 0.5, fontSize: '0.75rem', textAlign: 'center', marginBottom: '2rem' }}>
                Rules can be updated later in Preferences. Changes apply to future sessions.
            </p>
        </div>
    );
};
