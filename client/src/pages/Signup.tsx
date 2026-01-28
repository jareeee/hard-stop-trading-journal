import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export const Signup = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const response = await authService.signup({
                user: {
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    password
                }
            });

             // Token is handled by interceptor
            if (response.headers['authorization']) {
                 navigate('/dashboard'); 
            } else {
                 navigate('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            if (err.response?.data?.status?.message) {
                setError(err.response.data.status.message);
            } else {
                 setError('Registration failed. Please try again.');
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
                    <div className="input-row">
                        <div className="input-group w-full">
                            <label className="input-label">First Name</label>
                            <input 
                                type="text" 
                                className="input-field" 
                                placeholder="Wojciech"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group w-full">
                            <label className="input-label">Last Name</label>
                            <input 
                                type="text" 
                                className="input-field" 
                                placeholder="Wojceisch"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

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

                    <div className="input-group">
                        <label className="input-label">Confirm Password</label>
                        <div className="input-field-wrapper">
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                className="input-field" 
                                placeholder="••••••••" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                             <div 
                                className="input-icon"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </div>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary w-full" 
                        style={{ marginTop: '1rem', opacity: loading ? 0.7 : 1 }}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <p className="footer-text">
                        Already have account? 
                        <Link to="/login" className="footer-link">Login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};
