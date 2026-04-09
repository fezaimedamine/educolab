import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../api';
import './Navbar.css';

const NAV_ITEMS = [
  { to: '/directory',     label: 'Directory',     icon: '👥' },
  { to: '/messages',      label: 'Messages',      icon: '💬' },
  { to: '/announcements', label: 'Announcements', icon: '📢' },
  { to: '/meetings',      label: 'Meetings',      icon: '📅' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
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
        <div className="nav-brand-icon">🎓</div>
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
        {user?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon">⚙️</span>
            <span>Admin</span>
          </NavLink>
        )}
      </nav>

      {/* Right */}
      <div className="nav-right">
        {/* Bell */}
        <NavLink to="/notifications" className="nav-notif" aria-label="Notifications">
          🔔
          {unread > 0 && <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>}
        </NavLink>

        {/* User chip */}
        <div className="nav-user" title={user?.email}>
          <div className="nav-avatar">{initials}</div>
          <div>
            <div className="nav-user-name">{user?.firstName} {user?.lastName}</div>
            <div className="nav-user-role">{user?.role}</div>
          </div>
        </div>

        {/* Logout */}
        <button className="nav-logout" onClick={() => { logout(); navigate('/login'); }}>
          ↩ Logout
        </button>
      </div>
    </header>
  );
}
