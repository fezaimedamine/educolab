import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './DirectoryPage.css';

export default function DirectoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', role: '', group: '', specialty: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { data } = await api.get('/users', { params });
      setUsers(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const startConversation = async (userId) => {
    try {
      const { data } = await api.post('/conversations', { type: 'DIRECT', memberIds: [userId] });
      navigate(`/messages/${data.id}`);
    } catch (err) { console.error(err); }
  };

  const initials = (u) =>
    `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <>
      <Navbar />
      <main className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Directory</h1>
            <p>Find and connect with students, teachers and staff</p>
          </div>
        </div>

        {/* Filters */}
        <form className="dir-filters" onSubmit={e => { e.preventDefault(); fetchUsers(); }}>
          <input
            placeholder="Search by name or email…"
            value={filters.search}
            onChange={e => set('search', e.target.value)}
          />
          <select value={filters.role} onChange={e => set('role', e.target.value)}>
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            {user?.role === 'admin' && <option value="admin">Admins</option>}
          </select>
          <input
            placeholder="Group (e.g. G1)"
            value={filters.group}
            onChange={e => set('group', e.target.value)}
            style={{ maxWidth: 160 }}
          />
          <input
            placeholder="Specialty"
            value={filters.specialty}
            onChange={e => set('specialty', e.target.value)}
            style={{ maxWidth: 180 }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
          {(filters.search || filters.role || filters.group || filters.specialty) && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setFilters({ search: '', role: '', group: '', specialty: '' }); fetchUsers(); }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Results */}
        {loading ? (
          <p className="loading">Loading users…</p>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3>No users found</h3>
            <p>Try adjusting your search filters</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {users.length} user{users.length !== 1 ? 's' : ''} found
            </p>
            <div className="user-grid">
              {users.map(u => (
                <div key={u.id} className="user-card">
                  <div className="user-card-top">
                    <div className="user-avatar">{initials(u)}</div>
                    <div className="user-card-info">
                      <div className="user-name">{u.firstName} {u.lastName}</div>
                      <div className="user-email">{u.email}</div>
                    </div>
                    <span className={`tag tag-${u.role}`}>{u.role}</span>
                  </div>

                  {(u.groupName || u.specialty) && (
                    <div className="user-card-meta">
                      {u.groupName && <span className="chip">📚 {u.groupName}</span>}
                      {u.specialty && <span className="chip">🎯 {u.specialty}</span>}
                    </div>
                  )}

                  {u.id !== user?.id && (
                    <div className="user-card-action">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => startConversation(u.id)}
                      >
                        💬 Send message
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
