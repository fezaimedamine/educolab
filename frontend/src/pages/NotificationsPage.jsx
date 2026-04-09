import { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import './NotificationsPage.css';

const TYPE_ICON = {
  message:      '💬',
  announcement: '📢',
  meeting:      '📅',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then(r => setNotifications(r.data))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const fmt = (dt) => new Date(dt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  const unread = notifications.filter(n => !n.isRead);

  return (
    <>
      <Navbar />
      <main className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Notifications</h1>
            <p>
              {unread.length > 0
                ? `${unread.length} unread notification${unread.length !== 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
        </div>

        {/* Unread banner */}
        {unread.length > 0 && (
          <div className="notif-summary-bar">
            <span>🔵 {unread.length} new notification{unread.length !== 1 ? 's' : ''}</span>
            <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
              Mark all as read
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <p className="loading">Loading notifications…</p>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <h3>No notifications</h3>
            <p>You&apos;re all caught up!</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                onClick={() => !n.isRead && markRead(n.id)}
              >
                <div className="notif-icon-wrap">
                  {TYPE_ICON[n.type] ?? '🔔'}
                </div>
                <div className="notif-body">
                  <div className="notif-type">{n.type} notification</div>
                  <div className="notif-time">{fmt(n.createdAt)}</div>
                </div>
                {!n.isRead && <div className="notif-dot" />}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
