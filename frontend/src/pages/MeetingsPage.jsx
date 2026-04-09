import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './MeetingsPage.css';

export default function MeetingsPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', meetLink: '',
    startTime: '', endTime: '', targetGroup: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canCreate = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    api.get('/meetings')
      .then(r => setMeetings(r.data))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        targetGroup: form.targetGroup || null,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      };
      const { data } = await api.post('/meetings', payload);
      setMeetings(prev =>
        [data, ...prev].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      );
      setShowForm(false);
      setForm({ title: '', description: '', meetLink: '', startTime: '', endTime: '', targetGroup: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meeting?')) return;
    await api.delete(`/meetings/${id}`);
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  const isUpcoming = (dt) => new Date(dt) > new Date();

  const fmtDate = (dt) => new Date(dt).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short'
  });

  const fmtTime = (dt) => new Date(dt).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit'
  });

  const upcoming = meetings.filter(m => isUpcoming(m.startTime));
  const past = meetings.filter(m => !isUpcoming(m.startTime));

  return (
    <>
      <Navbar />
      <main className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Meetings</h1>
            <p>Scheduled Google Meet sessions — {upcoming.length} upcoming</p>
          </div>
          {canCreate && (
            <button
              className={`btn ${showForm ? 'btn-ghost' : 'btn-primary'}`}
              onClick={() => { setShowForm(v => !v); setError(''); }}
            >
              {showForm ? '✕ Cancel' : '+ Schedule Meeting'}
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="meeting-form-panel">
            <h3>📅 Schedule a Meeting</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title</label>
                <input
                  placeholder="Meeting title…"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description <span style={{ fontWeight: 400, fontSize: '0.75rem' }}>(optional)</span></label>
                <textarea
                  rows={2}
                  placeholder="What's this meeting about?"
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Google Meet Link</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={form.meetLink}
                  onChange={e => set('meetLink', e.target.value)}
                  required
                />
              </div>
              <div className="meeting-form-grid">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={e => set('startTime', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={e => set('endTime', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Target Group <span style={{ fontWeight: 400, fontSize: '0.75rem' }}>(leave empty for all)</span></label>
                <input
                  placeholder="e.g. G1"
                  value={form.targetGroup}
                  onChange={e => set('targetGroup', e.target.value)}
                  style={{ maxWidth: 180 }}
                />
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div className="meeting-form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Scheduling…' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <p className="loading">Loading meetings…</p>
        ) : meetings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>No meetings scheduled</h3>
            <p>{canCreate ? 'Schedule a meeting using the button above.' : 'No meetings have been scheduled yet.'}</p>
          </div>
        ) : (
          <div className="meetings-list">
            {upcoming.length > 0 && (
              <>
                <div className="meetings-section-label">Upcoming</div>
                {upcoming.map(m => (
                  <MeetingCard
                    key={m.id}
                    meeting={m}
                    user={user}
                    onDelete={handleDelete}
                    fmtDate={fmtDate}
                    fmtTime={fmtTime}
                    upcoming
                  />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <div className="meetings-section-label" style={{ marginTop: '1rem' }}>Past</div>
                {past.map(m => (
                  <MeetingCard
                    key={m.id}
                    meeting={m}
                    user={user}
                    onDelete={handleDelete}
                    fmtDate={fmtDate}
                    fmtTime={fmtTime}
                    upcoming={false}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}

function MeetingCard({ meeting: m, user, onDelete, fmtDate, fmtTime, upcoming }) {
  return (
    <div className={`meeting-card ${upcoming ? 'upcoming' : 'past'}`}>
      <div className="meeting-card-icon">
        {upcoming ? '🟢' : '⚫'}
      </div>
      <div className="meeting-card-body">
        <div className="meeting-card-top">
          <h3 className="meeting-card-title">{m.title}</h3>
          <div className="meeting-card-actions">
            {upcoming && (
              <a
                href={m.meetLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn-join btn-sm"
              >
                Join Meet ↗
              </a>
            )}
            {(user?.role === 'admin' || m.createdBy === user?.id) && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onDelete(m.id)}
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {m.description && (
          <p className="meeting-card-desc">{m.description}</p>
        )}

        <div className="meeting-card-meta">
          <span className="meeting-meta-item">👤 {m.authorName}</span>
          <span className="meeting-meta-item">
            📅 {fmtDate(m.startTime)} · {fmtTime(m.startTime)} – {fmtTime(m.endTime)}
          </span>
          {m.targetGroup
            ? <span className="tag tag-student">📚 {m.targetGroup}</span>
            : <span className="tag tag-teacher">🌐 All groups</span>
          }
        </div>
      </div>
    </div>
  );
}
