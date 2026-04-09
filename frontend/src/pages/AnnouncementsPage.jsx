import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './AnnouncementsPage.css';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', targetGroup: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canCreate = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    api.get('/announcements')
      .then(r => setAnnouncements(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...form, targetGroup: form.targetGroup || null };
      const { data } = await api.post('/announcements', payload);
      setAnnouncements(prev => [data, ...prev]);
      setShowForm(false);
      setForm({ title: '', content: '', targetGroup: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await api.delete(`/announcements/${id}`);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const fmt = (dt) => new Date(dt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <>
      <Navbar />
      <main className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Announcements</h1>
            <p>Stay updated with the latest news and information</p>
          </div>
          {canCreate && (
            <button
              className={`btn ${showForm ? 'btn-ghost' : 'btn-primary'}`}
              onClick={() => { setShowForm(v => !v); setError(''); }}
            >
              {showForm ? '✕ Cancel' : '+ New Announcement'}
            </button>
          )}
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="announce-form-panel">
            <h3>📢 New Announcement</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title</label>
                <input
                  placeholder="Announcement title…"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  rows={4}
                  placeholder="Write your announcement here…"
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Target Group <span style={{ fontWeight: 400, fontSize: '0.75rem' }}>(leave empty to send to everyone)</span></label>
                <input
                  placeholder="e.g. G1"
                  value={form.targetGroup}
                  onChange={e => setForm(f => ({ ...f, targetGroup: e.target.value }))}
                  style={{ maxWidth: 200 }}
                />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div className="announce-form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? (
          <p className="loading">Loading announcements…</p>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📢</div>
            <h3>No announcements yet</h3>
            <p>{canCreate ? 'Create the first announcement using the button above.' : 'Check back later for updates.'}</p>
          </div>
        ) : (
          <div className="announce-list">
            {announcements.map(a => (
              <article key={a.id} className="announce-card">
                <div className="announce-card-header">
                  <div>
                    <h3 className="announce-card-title">{a.title}</h3>
                    <div className="announce-card-meta">
                      <span className="announce-meta-item">👤 {a.authorName || 'Unknown'}</span>
                      <span className="announce-meta-item">🕒 {fmt(a.createdAt)}</span>
                      {a.targetGroup
                        ? <span className="tag tag-student">📚 {a.targetGroup}</span>
                        : <span className="tag tag-teacher">🌐 All groups</span>
                      }
                    </div>
                  </div>
                  {(user?.role === 'admin' || a.createdBy === user?.id) && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(a.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="announce-card-body">{a.content}</p>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
