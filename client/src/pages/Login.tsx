import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Link } from 'react-router-dom';

export const Login = () => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="auth-container">
            <Logo />
            <div className="auth-card">
                <form>
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input 
                            type="email" 
                            className="input-field" 
                            placeholder="trader@example.com"
                        />
                    </div>
                    
                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div className="input-field-wrapper">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="input-field" 
                                placeholder="••••••••" 
                            />
                            <div 
                                className="input-icon"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary w-full" style={{ marginTop: '1rem' }}>
                        Login
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
