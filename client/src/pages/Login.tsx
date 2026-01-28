import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login({
                user: { email, password }
            });
            
            // Token is handled by interceptor, but we can double check
            if (response.headers['authorization']) {
                 navigate('/dashboard'); // assume dashboard exists or will exist
            } else {
                 // Fallback if token not found in header (should be there)
                 navigate('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 401) {
                setError('Invalid email or password.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <Logo />
            <div className="auth-card">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input 
                            type="email" 
                            className="input-field" 
                            placeholder="trader@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div className="input-field-wrapper">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="input-field" 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <div 
                                className="input-icon"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary w-full" 
                        style={{ marginTop: '1rem', opacity: loading ? 0.7 : 1 }}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <p className="footer-text">
                        Don't have account? 
                        <Link to="/signup" className="footer-link">Sign Up</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};
