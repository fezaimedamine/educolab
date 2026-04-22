import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';
import api from '../api';
import './Navbar.css';
import { 
  Users, MessageSquare, Megaphone, Calendar, 
  Settings, LayoutDashboard, Moon, Sun, 
  Bell, LogOut, GraduationCap 
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/directory',     label: 'Directory',     icon: <Users size={18} /> },
  { to: '/messages',      label: 'Messages',      icon: <MessageSquare size={18} /> },
  { to: '/announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
  { to: '/meetings',      label: 'Meetings',      icon: <Calendar size={18} /> },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const doFetch = () =>
      api.get('/notifications/unread-count')
        .then(r => setUnread(r.data.count ?? 0))
        .catch(() => {});
    doFetch();
    const t = setInterval(doFetch, 10_000);
    return () => clearInterval(t);
  }, []);

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <header className="navbar">
      {/* Brand */}
      <div className="nav-brand">
        <div className="nav-brand-icon">
          <GraduationCap size={20} strokeWidth={2.5} />
        </div>
        EduColab
      </div>

      {/* Links */}
      <nav className="nav-links">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
        {user?.role === 'teacher' && (
          <NavLink to="/teacher" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><LayoutDashboard size={18} /></span>
            <span>Dashboard</span>
          </NavLink>
        )}
        {user?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><Settings size={18} /></span>
            <span>Admin</span>
          </NavLink>
        )}
      </nav>

      {/* Right */}
      <div className="nav-right">
        {/* Theme toggle */}
        <button
          className="nav-theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Bell */}
        <NavLink to="/notifications" className="nav-notif" aria-label="Notifications">
          <Bell size={18} />
          {unread > 0 && <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>}
        </NavLink>

        {/* User chip */}
        <div className="nav-user" title={user?.email}>
          <div className="nav-avatar">{initials}</div>
          <div className="nav-user-info">
            <div className="nav-user-name">{user?.firstName} {user?.lastName}</div>
            <div className="nav-user-role">{user?.role}</div>
          </div>
        </div>

        {/* Logout */}
        <button className="nav-logout" onClick={() => { logout(); navigate('/login'); }} title="Logout">
          <LogOut size={18} />
          <span className="nav-logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
}
