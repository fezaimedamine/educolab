import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './MeetingsPage.css';
import { 
  Video, Calendar, Clock, Users, BookOpen, 
  Trash2, Plus, MonitorPlay, ChevronRight, PlayCircle
} from 'lucide-react';

export default function MeetingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [joinCode, setJoinCode] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', courseName: '', meetLink: '',
    startTime: '', endTime: '', targetGroup: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canCreate = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    api.get('/meetings')
      .then(r => setMeetings(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generateMeetingCode = () => {
    return Math.random().toString(36).substring(2, 6) + '-' + 
           Math.random().toString(36).substring(2, 6) + '-' + 
           Math.random().toString(36).substring(2, 6);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const code = form.meetLink || generateMeetingCode();
      const payload = {
        ...form,
        meetLink: code,
        targetGroup: form.targetGroup || null,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      };
      const { data } = await api.post('/meetings', payload);
      setMeetings(prev => [...prev, data]);
      setShowForm(false);
      setForm({ title: '', description: '', courseName: '', meetLink: '', startTime: '', endTime: '', targetGroup: '' });
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

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      handleJoin(joinCode.trim());
    }
  };

  const handleJoin = (link) => {
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      navigate(`/meet/${link}`);
    }
  };

  const now = new Date();
  
  const { liveNow, upcoming, past } = useMemo(() => {
    const live = [];
    const up = [];
    const pst = [];
    meetings.forEach(m => {
      const st = new Date(m.startTime);
      const en = new Date(m.endTime);
      if (now >= st && now <= en) live.push(m);
      else if (st > now) up.push(m);
      else pst.push(m);
    });
    up.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    pst.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    return { liveNow: live, upcoming: up, past: pst };
  }, [meetings]);

  const fmtDate = (dt) => new Date(dt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtTime = (dt) => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <Navbar />
      <div className="mp-layout">
        <main className="mp-main">
          
          {/* Top Hero Section */}
          <section className="mp-hero">
            <div className="mp-hero-content">
              <h1 className="mp-hero-title">Virtual Classrooms</h1>
              <p className="mp-hero-subtitle">Connect, collaborate, and learn in real-time from anywhere.</p>
              
              <div className="mp-hero-actions">
                {canCreate && (
                  <button className="mp-btn-primary mp-btn-lg" onClick={() => setShowForm(!showForm)}>
                    <Video size={20} /> New Meeting
                  </button>
                )}
                <form className="mp-join-form" onSubmit={handleJoinSubmit}>
                  <div className="mp-join-input-wrap">
                    <MonitorPlay size={18} />
                    <input 
                      placeholder="Enter meeting code or link" 
                      value={joinCode} 
                      onChange={e => setJoinCode(e.target.value)} 
                    />
                  </div>
                  <button type="submit" disabled={!joinCode.trim()} className="mp-btn-secondary">Join</button>
                </form>
              </div>
            </div>
            <div className="mp-hero-illustration">
              <div className="mp-hero-grid">
                {[1,2,3,4].map(i => <div key={i} className={`mp-hero-cell c${i}`} />)}
              </div>
            </div>
          </section>

          {error && <div className="mp-alert-error">{error}</div>}

          {/* Creation Form */}
          {showForm && canCreate && (
             <div className="mp-creation-panel">
               <div className="mp-panel-header">
                 <h3><Calendar size={20} /> Schedule a Session</h3>
                 <button className="mp-close-btn" onClick={() => setShowForm(false)}>✕</button>
               </div>
               <form onSubmit={handleCreate} className="mp-form">
                 <div className="mp-form-row">
                   <div className="mp-input-group">
                     <label>Meeting Title</label>
                     <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Advanced Maths Lecture 4" />
                   </div>
                   <div className="mp-input-group">
                     <label>Course Name</label>
                     <input value={form.courseName} onChange={e => set('courseName', e.target.value)} placeholder="e.g. Mathematics" />
                   </div>
                 </div>

                 <div className="mp-form-row">
                   <div className="mp-input-group">
                     <label>Start Time</label>
                     <input required type="datetime-local" value={form.startTime} onChange={e => set('startTime', e.target.value)} />
                   </div>
                   <div className="mp-input-group">
                     <label>End Time</label>
                     <input required type="datetime-local" value={form.endTime} onChange={e => set('endTime', e.target.value)} />
                   </div>
                 </div>

                 <div className="mp-form-row">
                    <div className="mp-input-group">
                     <label>Target Group <span className="mp-label-hint">(leave empty for all)</span></label>
                     <input value={form.targetGroup} onChange={e => set('targetGroup', e.target.value)} placeholder="e.g. G1" />
                   </div>
                   <div className="mp-input-group">
                     <label>Custom Link / Code <span className="mp-label-hint">(optional)</span></label>
                     <input value={form.meetLink} onChange={e => set('meetLink', e.target.value)} placeholder="Auto-generates if empty" />
                   </div>
                 </div>

                 <div className="mp-input-group">
                   <label>Description (Optional)</label>
                   <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief agenda..." />
                 </div>

                 <div className="mp-form-footer">
                   <button type="button" className="mp-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                   <button type="submit" className="mp-btn-primary" disabled={submitting}>
                     {submitting ? 'Scheduling...' : 'Schedule Meeting'}
                   </button>
                 </div>
               </form>
             </div>
          )}

          {loading ? (
             <div className="mp-loading"><span className="mp-spinner" /> Loading your schedule...</div>
          ) : (
            <div className="mp-sections">

              {/* LIVE NOW SECTION */}
              {liveNow.length > 0 && (
                <section className="mp-section">
                  <h2 className="mp-section-title mp-live-title">
                    <span className="mp-dot-pulse" /> Live Now
                  </h2>
                  <div className="mp-grid">
                    {liveNow.map(m => (
                      <div key={m.id} className="mp-meet-card mp-card-live">
                        <div className="mp-card-bg-pulse" />
                        <div className="mp-meet-header">
                           <span className="mp-live-badge">LIVE</span>
                           {canCreate && <button className="mp-del-btn" onClick={() => handleDelete(m.id)}><Trash2 size={16} /></button>}
                        </div>
                        <h3 className="mp-meet-title">{m.title}</h3>
                        {m.courseName && <div className="mp-meet-course"><BookOpen size={14}/> {m.courseName}</div>}
                        <div className="mp-meet-teacher">Host: {m.authorName}</div>
                        <div className="mp-meet-meta">
                          <Clock size={14} /> Ends at {fmtTime(m.endTime)}
                        </div>
                        <button className="mp-btn-join-live" onClick={() => handleJoin(m.meetLink)}>
                          Join Now <ChevronRight size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* UPCOMING SECTION */}
              {upcoming.length > 0 && (
                 <section className="mp-section">
                  <h2 className="mp-section-title">Upcoming Meetings</h2>
                  <div className="mp-grid upcoming-grid">
                    {upcoming.map(m => (
                      <div key={m.id} className="mp-meet-card">
                        <div className="mp-meet-header">
                          <span className="mp-date-block">
                             <strong>{fmtDate(m.startTime).split(' ')[0]}</strong>
                             <span>{fmtDate(m.startTime).split(' ')[1]}</span>
                          </span>
                          {(canCreate && m.createdBy === user?.id || user?.role === 'admin') && 
                            <button className="mp-del-btn" onClick={() => handleDelete(m.id)}><Trash2 size={16} /></button>
                          }
                        </div>
                        <h3 className="mp-meet-title">{m.title}</h3>
                        {m.courseName && <div className="mp-meet-course"><BookOpen size={14}/> {m.courseName}</div>}
                        <div className="mp-meet-time">
                          <Clock size={16}/> {fmtTime(m.startTime)} - {fmtTime(m.endTime)}
                        </div>
                        <div className="mp-meet-teacher">
                           <Users size={14} /> {m.authorName || 'Teacher'} {m.targetGroup && `• ${m.targetGroup}`}
                        </div>
                        
                        <div className="mp-card-footer">
                           <button className="mp-btn-secondary" onClick={() => handleJoin(m.meetLink)}>Go to Room</button>
                           <button className="mp-btn-ghost">Remind Me</button>
                        </div>
                      </div>
                    ))}
                  </div>
                 </section>
              )}

              {/* PAST EXTRACT SECTION */}
              {past.length > 0 && (
                <section className="mp-section">
                  <h2 className="mp-section-title">Previous Recordings & Notes</h2>
                  <div className="mp-grid past-grid">
                    {past.slice(0, 4).map(m => (
                       <div key={m.id} className="mp-past-card">
                          <div className="mp-past-thumb">
                            <PlayCircle size={32} />
                          </div>
                          <div className="mp-past-info">
                            <h4>{m.title}</h4>
                            <p>{m.courseName || 'General Session'} • {fmtDate(m.startTime)}</p>
                          </div>
                       </div>
                    ))}
                  </div>
                </section>
              )}

              {meetings.length === 0 && (
                <div className="mp-empty-state">
                  <MonitorPlay size={48} strokeWidth={1} />
                  <h3>Your calendar is clear</h3>
                  <p>No active or scheduled meetings at the moment.</p>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </>
  );
}
