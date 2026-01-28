import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Link } from 'react-router-dom';

export const Signup = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div className="auth-container">
            <Logo />
            <div className="auth-card">
                <form>
                    <div className="input-row">
                        <div className="input-group w-full">
                            <label className="input-label">First Name</label>
                            <input 
                                type="text" 
                                className="input-field" 
                                placeholder="Wojciech"
                            />
                        </div>
                        <div className="input-group w-full">
                            <label className="input-label">Last Name</label>
                            <input 
                                type="text" 
                                className="input-field" 
                                placeholder="Wojceisch"
                            />
                        </div>
                    </div>

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

                    <div className="input-group">
                        <label className="input-label">Confirm Password</label>
                        <div className="input-field-wrapper">
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                className="input-field" 
                                placeholder="••••••••" 
                            />
                             <div 
                                className="input-icon"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary w-full" style={{ marginTop: '1rem' }}>
                        Sign Up
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
