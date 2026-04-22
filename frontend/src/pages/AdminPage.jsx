import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { 
  Users, UserCheck, GraduationCap, 
  BookOpen, Search, Shield, 
  Power, UserMinus, Filter,
  MoreVertical, Calendar, Mail
} from 'lucide-react';
import './AdminPage.css';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    api.get('/users')
      .then(r => setUsers(r.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const toggle = async (id, isActive) => {
    try {
      if (isActive) {
        await api.patch(`/users/${id}/deactivate`);
      } else {
        await api.patch(`/users/${id}/activate`);
      }
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchSearch = !search || 
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
      const matchRole = selectedRole === 'all' || u.role === selectedRole;
      return matchSearch && matchRole;
    });
  }, [users, search, selectedRole]);

  const count = (role) => users.filter(u => u.role === role).length;

  const stats = [
    { key: 'total',   label: 'Total Platform Users', value: users.length, icon: <Users size={20} />, color: '#4f46e5' },
    { key: 'student', label: 'Registered Students', value: count('student'), icon: <GraduationCap size={20} />, color: '#8b5cf6' },
    { key: 'teacher', label: 'Faculty Members', value: count('teacher'), icon: <BookOpen size={20} />, color: '#10b981' },
    { key: 'active',  label: 'Active Right Now',  value: users.filter(u => u.isActive).length, icon: <UserCheck size={20} />, color: '#f59e0b' },
  ];

  return (
    <div className="admin-layout">
      <Navbar />
      
      <main className="admin-container">
        {/* Creative Header */}
        <header className="admin-header">
          <div className="header-content">
            <div className="header-badge">
              <Shield size={14} />
              <span>Administration</span>
            </div>
            <h1>Command Center</h1>
            <p>Monitor platform growth and manage user accessibility across the EduColab ecosystem.</p>
          </div>
          <div className="header-visual">
            <div className="blur-blob purple"></div>
            <div className="blur-blob blue"></div>
          </div>
        </header>

        {/* Innovative Stats Grid */}
        <section className="stats-grid">
          {stats.map(s => (
            <div key={s.key} className="modern-stat-card">
              <div className="stat-card-inner">
                <div className="stat-icon-box" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                  {s.icon}
                </div>
                <div className="stat-info">
                  <span className="stat-label">{s.label}</span>
                  <p className="stat-value">{s.value}</p>
                </div>
              </div>
              <div className="stat-progress">
                <div className="progress-bar" style={{ width: '60%', backgroundColor: s.color }}></div>
              </div>
            </div>
          ))}
        </section>

        {/* Controls Section */}
        <section className="admin-controls">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email or group..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <div className="filter-label">
              <Filter size={16} />
              <span>Role Filter:</span>
            </div>
            {['all', 'student', 'teacher', 'admin'].map(role => (
              <button
                key={role}
                className={`role-tab ${selectedRole === role ? 'active' : ''}`}
                onClick={() => setSelectedRole(role)}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Interactive Table */}
        <section className="table-container">
          {loading ? (
            <div className="admin-loader">
              <div className="spinner"></div>
              <p>Syncing database...</p>
            </div>
          ) : (
            <div className="modern-table-wrap">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>User Identity</th>
                    <th>Role & Status</th>
                    <th>Academic Info</th>
                    <th>Accessibility</th>
                    <th>Performance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-row">
                        <Users size={48} className="empty-icon" />
                        <p>No identities found matching the current filters.</p>
                      </td>
                    </tr>
                  ) : filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar" style={{ background: `linear-gradient(135deg, #4f46e5, #8b5cf6)` }}>
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <div className="user-info">
                            <span className="user-name">{u.firstName} {u.lastName}</span>
                            <span className="user-mail">
                              <Mail size={12} />
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="status-cell">
                          <span className={`role-badge ${u.role}`}>{u.role}</span>
                          <span className={`status-dot ${u.isActive ? 'active' : 'inactive'}`}>
                            {u.isActive ? 'Online' : 'Restricted'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="academic-cell">
                          <div className="academic-item">
                            <GraduationCap size={14} />
                            <span>{u.groupName || 'No Group'}</span>
                          </div>
                          {u.specialty && (
                            <div className="academic-item specialty">
                              <BookOpen size={14} />
                              <span>{u.specialty}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="access-level">
                          <Shield size={14} />
                          <span>Standard User</span>
                        </div>
                      </td>
                      <td>
                        <div className="participation-index">
                          <div className="index-value">84%</div>
                          <div className="index-bar"><div className="fill" style={{width: '84%'}}></div></div>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className={`toggle-btn ${u.isActive ? 'deactivate' : 'activate'}`}
                            onClick={() => toggle(u.id, u.isActive)}
                            title={u.isActive ? 'Revoke Access' : 'Grant Access'}
                          >
                            {u.isActive ? <UserMinus size={18} /> : <Power size={18} />}
                          </button>
                          <button className="more-btn">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
