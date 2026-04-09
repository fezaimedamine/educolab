import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './MessagesPage.css';

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberIds, setMemberIds] = useState('');

  useEffect(() => {
    api.get('/conversations')
      .then(r => setConversations(r.data))
      .finally(() => setLoading(false));
  }, []);

  const createGroup = async (e) => {
    e.preventDefault();
    const ids = memberIds.split(',').map(s => s.trim()).filter(Boolean);
    const { data } = await api.post('/conversations', {
      type: 'group', name: groupName, memberIds: ids
    });
    setConversations(prev => [data, ...prev]);
    setShowModal(false);
    setGroupName('');
    setMemberIds('');
  };

  const getConvName = (conv) => {
    if (conv.type === 'group') return conv.name || 'Group Chat';
    const other = conv.members?.find(m => m.userId !== user?.id);
    return other ? `${other.firstName} ${other.lastName}` : 'Direct Message';
  };

  const getInitials = (conv) => {
    if (conv.type === 'group') return '👥';
    const name = getConvName(conv);
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  const filtered = conversations.filter(c =>
    !search || getConvName(c).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <main className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Messages</h1>
            <p>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Group
          </button>
        </div>

        {/* Search */}
        <div className="conv-search">
          <input
            placeholder="Search conversations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {loading ? (
          <p className="loading">Loading conversations…</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3>No conversations</h3>
            <p>Go to the <strong>Directory</strong> and message a user to start chatting</p>
          </div>
        ) : (
          <div className="conv-list">
            {filtered.map(conv => (
              <div
                key={conv.id}
                className="conv-item"
                onClick={() => navigate(`/messages/${conv.id}`)}
              >
                <div className={`conv-avatar ${conv.type === 'group' ? 'conv-avatar-group' : ''}`}>
                  {conv.type === 'group' ? '👥' : getInitials(conv)}
                </div>
                <div className="conv-info">
                  <div className="conv-name">{getConvName(conv)}</div>
                  <div className="conv-sub">
                    {conv.type === 'group'
                      ? `${conv.members?.length ?? 0} members`
                      : 'Direct message'}
                  </div>
                </div>
                <span className="conv-badge">{conv.type}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>›</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create group modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create Group Chat</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={createGroup}>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  placeholder="e.g. CS Group G1"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Member IDs (comma-separated)</label>
                <textarea
                  rows={3}
                  value={memberIds}
                  onChange={e => setMemberIds(e.target.value)}
                  placeholder="uuid1, uuid2, …"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
