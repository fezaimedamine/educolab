import { useState, useEffect } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { 
  Megaphone, 
  Video, 
  MessageSquare, 
  Users, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Plus, 
  TrendingUp,
  BookOpen,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './TeacherPage.css';

export default function TeacherPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeMeetings: 0,
    pendingTasks: 4 // Mocked for UI richness
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [annRes, meetRes, userRes] = await Promise.all([
          api.get('/announcements'),
          api.get('/meetings'),
          api.get('/users') // Assuming this endpoint exists to count students
        ]);

        // Filter those created by this teacher
        const myAnn = annRes.data.filter(a => a.createdBy === user?.id || a.createdBy?.id === user?.id || a.createdById === user?.id);
        const myMeet = meetRes.data.filter(m => m.createdBy === user?.id || m.createdBy?.id === user?.id || m.createdById === user?.id);
        const students = userRes.data.filter(u => u.role === 'student');

        setAnnouncements(myAnn.slice(0, 5)); 
        setMeetings(myMeet.slice(0, 5));
        setStats(prev => ({
          ...prev,
          totalStudents: students.length,
          activeMeetings: myMeet.filter(m => new Date(m.startTime) > new Date()).length
        }));
      } catch (err) {
        console.error("Error fetching teacher dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const quickStats = [
    { label: 'Active Students', value: stats.totalStudents, icon: <Users size={20} />, color: 'blue', secondary: '+2 this week' },
    { label: 'Upcoming Classes', value: stats.activeMeetings, icon: <Video size={20} />, color: 'emerald', secondary: 'Next in 2h' },
    { label: 'Recent Posts', value: announcements.length, icon: <Megaphone size={20} />, color: 'violet', secondary: '34 views' },
    { label: 'Inbound Inquiries', value: 3, icon: <MessageSquare size={20} />, color: 'amber', secondary: 'Requires action' },
  ];

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <>
      <Navbar />
      <main className="teacher-dashboard-premium">
        {/* Hero Section */}
        <section className="td-hero">
          <div className="td-hero-content">
            <div className="td-badge">
              <Sparkles size={14} /> TEACHER PORTAL
            </div>
            <h1>{getTimeGreeting()}, {user?.firstName || 'Professor'}!</h1>
            <p>Your educational command center. Manage your classes, engage students, and track academic progress.</p>
            
            <div className="td-hero-actions">
              <Link to="/meetings" className="btn btn-primary btn-lg">
                <Plus size={18} /> Schedule a Class
              </Link>
              <Link to="/announcements" className="btn btn-ghost">
                <Megaphone size={18} /> Post Update
              </Link>
            </div>
          </div>
          <div className="td-hero-visual">
            <div className="visual-circle circle-1"></div>
            <div className="visual-circle circle-2"></div>
            <div className="visual-stats-preview">
              <div className="preview-row">
                <Activity size={14} /> Performance: 94%
              </div>
              <div className="preview-row">
                <Users size={14} /> Class Reach: 1.2k
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="td-stats-grid">
          {quickStats.map((stat, i) => (
            <div key={i} className={`td-stat-card ${stat.color}`}>
              <div className="stat-header">
                <div className="stat-icon-box">{stat.icon}</div>
                <div className="stat-trend">
                  <TrendingUp size={12} /> 12%
                </div>
              </div>
              <div className="stat-body">
                <h3>{loading ? '...' : stat.value}</h3>
                <p>{stat.label}</p>
              </div>
              <div className="stat-footer">
                <span>{stat.secondary}</span>
              </div>
            </div>
          ))}
        </section>

        <div className="td-content-layout">
          {/* Main Feed */}
          <div className="td-main">
            <div className="td-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Calendar size={20} />
                  <h2>Upcoming Schedule</h2>
                </div>
                <Link to="/meetings" className="panel-link">View All <ArrowRight size={14} /></Link>
              </div>
              
              <div className="td-meeting-list">
                {loading ? (
                  Array(3).fill(0).map((_, i) => <div key={i} className="skeleton-item"></div>)
                ) : meetings.length > 0 ? (
                  meetings.map(m => (
                    <div key={m.id} className="td-meeting-item">
                      <div className="meeting-date-box">
                        <span className="month">{new Date(m.startTime).toLocaleString('default', { month: 'short' })}</span>
                        <span className="day">{new Date(m.startTime).getDate()}</span>
                      </div>
                      <div className="meeting-info">
                        <h3>{m.title}</h3>
                        <div className="meeting-meta">
                          <span><Clock size={14} /> {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span><Users size={14} /> {m.targetGroup || 'General'}</span>
                        </div>
                      </div>
                      <Link to={`/live-meet/${m.id}`} className="btn btn-sm btn-ghost join-btn">
                        <Video size={14} /> Launch
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="td-empty">
                    <BookOpen size={24} />
                    <p>No classes scheduled for today.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="td-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Megaphone size={20} />
                  <h2>Latest Announcements</h2>
                </div>
                <Link to="/announcements" className="panel-link">Feed <ArrowRight size={14} /></Link>
              </div>
              <div className="td-announcement-cards">
                {loading ? (
                  Array(2).fill(0).map((_, i) => <div key={i} className="skeleton-item"></div>)
                ) : announcements.length > 0 ? (
                  announcements.map(a => (
                    <div key={a.id} className="td-ann-card">
                      <div className="ann-status"></div>
                      <div className="ann-content">
                        <h3>{a.title}</h3>
                        <p>{a.content?.substring(0, 80)}...</p>
                        <div className="ann-footer">
                          <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                          {a.courseName && <span className="ann-badge">{a.courseName}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="td-empty">
                    <p>No announcements yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="td-sidebar">
            <div className="td-panel quick-links">
              <h3>Quick Actions</h3>
              <div className="action-grid">
                <button className="action-btn">
                  <Zap size={18} />
                  <span>Instant Meet</span>
                </button>
                <button className="action-btn">
                  <Users size={18} />
                  <span>Directory</span>
                </button>
                <button className="action-btn">
                  <MessageSquare size={18} />
                  <span>Admin Chat</span>
                </button>
                <button className="action-btn">
                  <BookOpen size={18} />
                  <span>Resources</span>
                </button>
              </div>
            </div>

            <div className="td-panel activity-panel">
              <h3>Recent Activity</h3>
              <div className="activity-feed">
                <div className="activity-item">
                  <div className="activity-icon"><Users size={12} /></div>
                  <div className="activity-text">
                    <strong>Jean Dupont</strong> joined CS101
                    <span>2 mins ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon blue"><MessageSquare size={12} /></div>
                  <div className="activity-text">
                    New message from <strong>Support</strong>
                    <span>45 mins ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon emerald"><Zap size={12} /></div>
                  <div className="activity-text">
                    Meeting <strong>Lab Revision</strong> finished
                    <span>1 hour ago</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="td-promo-card">
              <Sparkles size={24} />
              <h4>Pro Tips</h4>
              <p>Try the new collaborative whiteboards in your next live meeting!</p>
              <button className="btn btn-primary btn-sm">Learn More</button>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
