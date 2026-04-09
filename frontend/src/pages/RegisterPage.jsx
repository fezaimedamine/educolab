import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Auth.css';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    role: 'student', groupName: '', specialty: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      navigate('/directory');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-box auth-box-wide">
        {/* Logo */}
        <div className="auth-logo-wrap">
          <div className="auth-logo-icon">🎓</div>
          <span className="auth-app-name">EduColab</span>
        </div>

        {/* Card */}
        <div className="auth-card">
          <h1 className="auth-card-title">Create account</h1>
          <p className="auth-card-sub">Join the EduColab platform today</p>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  placeholder="Ahmed"
                  value={form.firstName}
                  onChange={e => set('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  placeholder="Benali"
                  value={form.lastName}
                  onChange={e => set('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email address</label>
              <input
                id="reg-email"
                type="email"
                placeholder="you@university.edu"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select id="role" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {form.role === 'student' && (
                <div className="form-group">
                  <label htmlFor="groupName">Group</label>
                  <input
                    id="groupName"
                    placeholder="e.g. G1"
                    value={form.groupName}
                    onChange={e => set('groupName', e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="specialty">Specialty</label>
              <input
                id="specialty"
                placeholder="e.g. Computer Science"
                value={form.specialty}
                onChange={e => set('specialty', e.target.value)}
              />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p className="auth-footer-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
