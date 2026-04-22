import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { 
  Bell, CheckCheck, MessageSquare, 
  Megaphone, Calendar, Clock, User,
  ExternalLink, BellOff, Sparkles,
  Inbox, Filter, MoreHorizontal
} from 'lucide-react';
import './NotificationsPage.css';

const TYPE_CONFIG = {
  message:      { icon: <MessageSquare size={16} />, color: '#6366f1', label: 'Message',      path: (id) => `/messages/${id}` },
  announcement: { icon: <Megaphone size={16} />,     color: '#f59e0b', label: 'Announcement', path: () => `/announcements` },
  meeting:      { icon: <Calendar size={16} />,      color: '#10b981', label: 'Meeting',      path: () => `/meetings` },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, message, announcement, meeting
  const navigate = useNavigate();

  const fetchNotifs = () => {
    api.get('/notifications')
      .then(r => setNotifications(r.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchNotifs();
  }, []);

  const filteredNotifs = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotifClick = async (n) => {
    if (!n.read) {
      try {
        await api.patch(`/notifications/${n.id}/read`);
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
      } catch (e) {
        console.error(e);
      }
    }
    
    const config = TYPE_CONFIG[n.type];
    if (config) {
      navigate(config.path(n.referenceId));
    }
  };

  const fmt = (dt) => {
    const d = new Date(dt);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notif-layout">
      <Navbar />
      
      <div className="notif-container">
        {/* Sidebar Filters */}
        <aside className="notif-sidebar">
          <div className="sidebar-header">
            <div className="inbox-icon">
              <Inbox size={20} />
            </div>
            <span>Activity Center</span>
          </div>
          
          <nav className="filter-nav">
            <button className={`filter-item ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
              <Bell size={18} />
              <span>All Activity</span>
              <span className="count">{notifications.length}</span>
            </button>
            <button className={`filter-item ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>
              <CheckCheck size={18} />
              <span>Unread</span>
              {unreadCount > 0 && <span className="count badge-unread">{unreadCount}</span>}
            </button>
            <div className="nav-divider">Categories</div>
            <button className={`filter-item ${filter === 'message' ? 'active' : ''}`} onClick={() => setFilter('message')}>
              <MessageSquare size={18} />
              <span>Messages</span>
            </button>
            <button className={`filter-item ${filter === 'announcement' ? 'active' : ''}`} onClick={() => setFilter('announcement')}>
              <Megaphone size={18} />
              <span>Announcements</span>
            </button>
            <button className={`filter-item ${filter === 'meeting' ? 'active' : ''}`} onClick={() => setFilter('meeting')}>
              <Calendar size={18} />
              <span>Meetings</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <p>Last checked: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
        </aside>

        {/* Main Feed */}
        <main className="notif-main-feed">
          <header className="feed-header">
            <div className="title-group">
              <h1>{filter === 'all' ? 'Your Feed' : filter.charAt(0).toUpperCase() + filter.slice(1)}</h1>
              <div className="status-label">
                <Sparkles size={14} />
                <span>Modern Experience</span>
              </div>
            </div>
            
            <div className="header-actions">
              {unreadCount > 0 && (
                <button className="mark-read-global" onClick={markAllRead}>
                  Mark all as read
                </button>
              )}
            </div>
          </header>

          <div className="feed-content">
            {loading ? (
              <div className="feed-loader">
                <div className="pulse-circle"></div>
                <p>Curating your updates...</p>
              </div>
            ) : filteredNotifs.length === 0 ? (
              <div className="feed-empty">
                <div className="creative-empty-icon">
                  <BellOff size={64} />
                  <div className="aura"></div>
                </div>
                <h2>Nothing new here</h2>
                <p>Enjoy your productive time! We'll alert you when there's an update.</p>
                <button className="btn-refresh" onClick={fetchNotifs}>Refresh Feed</button>
              </div>
            ) : (
              <div className="notif-stack">
                {filteredNotifs.map((n, idx) => {
                  const config = TYPE_CONFIG[n.type] || { icon: <Bell size={16} />, color: '#64748b' };
                  return (
                    <div 
                      key={n.id} 
                      className={`notif-creative-card ${!n.read ? 'is-unread' : ''}`}
                      style={{ '--delay': `${idx * 0.05}s`, '--accent': config.color }}
                      onClick={() => handleNotifClick(n)}
                    >
                      <div className="card-indicator" style={{ backgroundColor: config.color }}></div>
                      
                      <div className="card-body">
                        <div className="card-left">
                          <div className="avatar-group">
                            <div className="main-avatar">
                              {n.senderName?.[0] || '?'}
                            </div>
                            <div className="type-badge" style={{ backgroundColor: config.color }}>
                              {config.icon}
                            </div>
                          </div>
                        </div>

                        <div className="card-center">
                          <div className="card-meta">
                            <span className="sender">{n.senderName || 'EduColab'}</span>
                            <span className="dot">•</span>
                            <span className="time">{fmt(n.createdAt)}</span>
                          </div>
                          <h3 className="card-title">{n.title || 'Notification'}</h3>
                          <p className="card-text">{n.content}</p>
                        </div>

                        <div className="card-right">
                          <div className="action-button">
                            <ExternalLink size={18} />
                          </div>
                          {!n.read && <div className="unread-pulse"></div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
