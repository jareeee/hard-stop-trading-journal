import { authService, type User } from '../services/auth';
import { useEffect, useState } from 'react';

export const Settings = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        authService.getCurrentUser().then(data => setUser(data.data));
    }, []);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Account Settings</h1>
                    <p className="dashboard-subtitle">Manage your account preferences and profile</p>
                </div>
            </header>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Profile Information</h3>
                </div>
                <div className="card-content" style={{ padding: '2rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="input-label">Email Address</label>
                        <input className="input-field" value={user?.email || ''} readOnly disabled />
                        <p className="hint-text">Your email address is used for login and notifications.</p>
                    </div>
                    <div>
                        <label className="input-label">Full Name</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input className="input-field" value={user?.first_name || ''} readOnly disabled placeholder="First Name" />
                            <input className="input-field" value={user?.last_name || ''} readOnly disabled placeholder="Last Name" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h3 className="card-title">Application Preferences</h3>
                </div>
                <div className="card-content" style={{ padding: '2rem' }}>
                    <p style={{ color: 'var(--color-text-tertiary)' }}>More settings coming soon...</p>
                </div>
            </div>
        </div>
    );
};
