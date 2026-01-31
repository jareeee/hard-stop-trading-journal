import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Logo } from '../components/Logo';

export const DisciplineCommitment = () => {
    const [accepted, setAccepted] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="onboarding-container">
            <Logo />
            
            <div className="onboarding-card" style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Before You Trade</h2>
                <p style={{ marginBottom: '1rem' }}>HardStop does not help you make money.</p>
                <p>It helps you stop losing money from emotional decisions.</p>
            </div>

            <div style={{ margin: '1rem 0', color: '#333' }}>|</div>

            <div className="onboarding-card">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', textAlign: 'center' }}>Discipline Commitment</h2>
                <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>This system will warn you when you break your own rules.</p>
                
                <div className="commitment-box">
                    <AlertCircle className="warning-icon" size={24} />
                    <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                        <p style={{ color: '#ef4444', fontWeight: '600', marginBottom: '0.5rem' }}>
                            HardStop is a tool for self-discipline. It cannot prevent you from making trades.
                        </p>
                        <p style={{ color: '#a1a1aa' }}>
                            You remain fully responsible for all trading decisions and their consequences.
                        </p>
                    </div>
                </div>

                <label className="checkbox-container">
                    <input 
                        type="checkbox" 
                        checked={accepted} 
                        onChange={(e) => setAccepted(e.target.checked)} 
                    />
                    <span>I understand and accept responsibility for my trades.</span>
                </label>
            </div>

            <div className="progress-dots">
                <div className="dot active"></div>
                <div className="dot"></div>
                <div className="dot"></div>
            </div>

            <button 
                className="btn-primary w-full" 
                disabled={!accepted}
                onClick={() => navigate('/rule-configuration')}
                style={{ backgroundColor: accepted ? 'white' : '#52525b', color: accepted ? 'black' : '#a1a1aa' }}
            >
                Continue to Rule Setup
            </button>

            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#52525b' }}>
                This setup takes 2-3 minutes to complete
            </p>
        </div>
    );
};
