import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigate('/login');
        } catch (error) {
            console.error(error);
            navigate('/login');
        }
    };

    return (
        <div style={{ color: 'white', padding: '2rem' }}>
            <h1>Dashboard</h1>
            <p>Welcome to HardStop.</p>
            <button 
                onClick={handleLogout}
                className="btn-primary"
                style={{ marginTop: '1rem', width: 'auto', padding: '0.5rem 1rem' }}
            >
                Logout
            </button>
        </div>
    );
};
