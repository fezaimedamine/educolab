import { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import './AdminPage.css';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/users')
      .then(r => setUsers(r.data))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id, isActive) => {
    const endpoint = isActive ? `/users/${id}/deactivate` : `/users/${id}/activate`;
    const { data } = await api.patch(endpoint);
    setUsers(prev => prev.map(u => u.id === id ? data : u));
  };

  const filtered = users.filter(u =>
    !search ||
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const count = (role) => users.filter(u => u.role === role).length;

  const stats = [
    { key: 'total',   label: 'Total Users',  value: users.length,                          icon: '👥', cls: 'stat-total' },
    { key: 'student', label: 'Students',      value: count('student'),                       icon: '🎓', cls: 'stat-student' },
    { key: 'teacher', label: 'Teachers',      value: count('teacher'),                       icon: '📚', cls: 'stat-teacher' },
    { key: 'active',  label: 'Active Users',  value: users.filter(u => u.isActive).length,  icon: '✅', cls: 'stat-active' },
  ];

  return (
    <>
      <Navbar />
      <main className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage platform users and permissions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          {stats.map(s => (
            <div key={s.key} className={`stat-card ${s.cls}`}>
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="admin-search">
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <p className="loading">Loading users…</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Group</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No users match your search
                    </td>
                  </tr>
                ) : filtered.map(u => (
                  <tr key={u.id}>
                    <td className="td-name">{u.firstName} {u.lastName}</td>
                    <td className="td-email">{u.email}</td>
                    <td><span className={`tag tag-${u.role}`}>{u.role}</span></td>
                    <td className="td-group">{u.groupName || '—'}</td>
                    <td>
                      {u.isActive
                        ? <span className="status-active">● Active</span>
                        : <span className="status-inactive">○ Inactive</span>
                      }
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-ghost'}`}
                        onClick={() => toggle(u.id, u.isActive)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
