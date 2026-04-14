import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import './MessagesPage.css';
import ConfirmModal from '../components/ConfirmModal';

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmModal, setConfirmModal] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [toast, setToast] = useState(null);

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = () => {
    api.get('/conversations')
      .then(r => setConversations(r.data))
      .finally(() => setLoading(false));
  };
  
  const deleteConversation = (convId, convName) => {
    setConfirmModal({
      title: 'Delete Conversation',
      message: `Permanently delete "${convName}"? This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/conversations/${convId}`);
          setConversations(prev => prev.filter(c => c.id !== convId));
          showToast('Conversation deleted', 'success');
        } catch (err) {
          showToast('Failed to delete conversation', 'error');
        }
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/conversations', {
        type: 'GROUP',
        name: groupName
      });
      setConversations(prev => [data, ...prev]);
      setShowCreateModal(false);
      setGroupName('');
      showToast('Group created successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create group', 'error');
    }
  };

  const joinByCode = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/conversations/join', {
        code: joinCode.toUpperCase()
      });
      setConversations(prev => [data, ...prev]);
      setShowJoinModal(false);
      setJoinCode('');
      showToast('Joined group successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid invite code', 'error');
    }
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowJoinModal(true)}>
              Join Group
            </button>
            {isTeacherOrAdmin && (
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                + New Group
              </button>
            )}
          </div>
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
            <p>Join a group with an invite code or start a direct message</p>
          </div>
        ) : (
          <div className="conv-list">
            {filtered.map(conv => (
              <div
                key={conv.id}
                className="conv-item"
                style={{ position: 'relative' }}
              >
                <div 
                  style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}
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
                
                {/* //this btn isnt workring so it gets removed// isTeacherOrAdmin && (
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id, getConvName(conv));
                    }}
                    style={{ color: 'var(--red)', marginLeft: '0.5rem' }}
                    title="Delete conversation"
                  >
                    🗑️
                  </button>
                )*/}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create Group Chat</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowCreateModal(false)}>✕</button>
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
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="modal-backdrop" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Join Group Chat</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowJoinModal(false)}>✕</button>
            </div>
            <form onSubmit={joinByCode}>
              <div className="form-group">
                <label>Invite Code</label>
                <input
                  placeholder="Enter 6-character code"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  required
                />
                <small style={{ color: 'var(--text-tertiary)', marginTop: '0.5rem', display: 'block' }}>
                  Ask your teacher for the group invite code
                </small>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowJoinModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Join Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  );
}