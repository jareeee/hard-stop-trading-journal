import { NavLink } from 'react-router-dom';
import { authService } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings2, User, LogOut, Play, BookOpen } from 'lucide-react';

export const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: clear token and redirect anyway
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/session', label: 'Session', icon: <Play size={20} /> },
    { path: '/trade-log', label: 'Trade Log', icon: <BookOpen size={20} /> },
    { path: '/rule-configuration', label: 'Rules Setup', icon: <Settings2 size={20} /> },
    { path: '/settings', label: 'Settings', icon: <User size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-text">HARD<span>STOP</span></span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon"><LogOut size={20} /></span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

