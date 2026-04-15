import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { createWebSocketClient } from '../utils/websocket';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import ImagePreviewModal from '../components/ImagePreviewModal';
import './ChatPage.css';

export default function ChatPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newConvName, setNewConvName] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [events, setEvents] = useState([]);
  const [imageBlobUrls, setImageBlobUrls] = useState({});
  
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const wsClientRef = useRef(null);

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/conversations/${id}/messages`);
      setMessages([...data].reverse());
    } catch {
      navigate('/messages');
    }
  };

  const fetchConversation = async () => {
    try {
      const { data } = await api.get('/conversations');
      const conv = data.find(c => c.id === id);
      if (conv) setConversation(conv);
    } catch (err) {
      console.error(err);
    }
  };

  // ✨ WebSocket Setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setWsStatus('connecting');
    
    const client = createWebSocketClient(
      token,
      () => {
        setWsStatus('connected');
        
        // Subscribe to new messages
        client.subscribe(`/topic/conversations/${id}`, (message) => {
          const newMsg = JSON.parse(message.body);
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        });

        // Subscribe to message updates
        client.subscribe(`/topic/conversations/${id}/update`, (message) => {
          const updatedMsg = JSON.parse(message.body);
          setMessages(prev => prev.map(m => 
            m.id === updatedMsg.id ? updatedMsg : m
          ));
        });

        // Subscribe to message deletions
        client.subscribe(`/topic/conversations/${id}/delete`, (message) => {
          const { messageId } = JSON.parse(message.body);
          setMessages(prev => prev.filter(m => m.id !== messageId));
        });

        // Subscribe to conversation events (join/leave)
        client.subscribe(`/topic/conversations/${id}/events`, (message) => {
          //console.log("EVENT RECEIVED:", message.body);
          const event = JSON.parse(message.body);
          setEvents(prev => [...prev, event]);
          // Refresh conversation to update member list
          fetchConversation();
        });
      },
      () => {
        setWsStatus('disconnected');
        fetchMessages();
      }
    );

    client.activate();
    wsClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [id]);

  const fetchEvents = async () => {
    const { data } = await api.get(`/conversations/${id}/events`);
    setEvents(data);
  };

  useEffect(() => {
    fetchConversation();
    fetchMessages().finally(() => setLoading(false));
    fetchEvents();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, events]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      showToast('Maximum 5 files allowed', 'error');
      return;
    }

    // Validate file sizes
    const oversized = files.find(f => f.size > 10 * 1024 * 1024);
    if (oversized) {
      showToast('File size exceeds 10MB: ' + oversized.name, 'error');
      return;
    }

    setSelectedFiles(files);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const send = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    
    if (!trimmed && selectedFiles.length === 0) {
      showToast('Message cannot be empty', 'error');
      return;
    }

    try {
      setUploading(true);

      if (selectedFiles.length > 0) {
        // Send with files
        const formData = new FormData();
        if (trimmed) formData.append('content', trimmed);
        selectedFiles.forEach(file => formData.append('files', file));

        await api.post(`/conversations/${id}/messages/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Send text only
        await api.post(`/conversations/${id}/messages`, { content: trimmed });
      }

      setContent('');
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      inputRef.current?.focus();
    } catch (err) {
      showToast('Failed to send message', 'error');
    } finally {
      setUploading(false);
    }
  };

  const startEditMessage = (msg) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const saveEditMessage = async (messageId) => {
    if (!editContent.trim()) {
      showToast('Message cannot be empty', 'error');
      return;
    }
    try {
      await api.patch(`/conversations/${id}/messages/${messageId}`, { 
        content: editContent.trim() 
      });
      setEditingMessageId(null);
      showToast('Message updated', 'success');
    } catch (err) {
      showToast('Failed to update message', 'error');
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const deleteMessage = (messageId, messageContent) => {
    setConfirmModal({
      title: 'Delete Message',
      message: `Delete "${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}"?`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/conversations/${id}/messages/${messageId}`);
          showToast('Message deleted', 'success');
        } catch (err) {
          showToast('Failed to delete message', 'error');
        }
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const downloadAttachment = async (attachmentId, fileName) => {
    try {
      const response = await api.get(`/conversations/attachments/${attachmentId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast('Failed to download file', 'error');
    }
  };

  // Fetch image with auth headers
  const fetchImageBlob = async (attachmentId) => {
    if (imageBlobUrls[attachmentId]) return imageBlobUrls[attachmentId];
    
    try {
      const response = await api.get(`/conversations/attachments/${attachmentId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(response.data);
      setImageBlobUrls(prev => ({ ...prev, [attachmentId]: url }));
      return url;
    } catch (err) {
      console.error('Failed to load image', err);
      return null;
    }
  };

  useEffect(() => {
    // Preload images when messages load
    messages.forEach(msg => {
      msg.attachments?.forEach(att => {
        if (isImage(att.mimeType)) {
          fetchImageBlob(att.id);
        }
      });
    });
    
    // Cleanup blob URLs on unmount
    return () => {
      Object.values(imageBlobUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [messages]);

  const openImagePreview = (attachmentId, fileName) => {
    const url = imageBlobUrls[attachmentId];
    if (url) {
      setImagePreview({ url, fileName });
    }
  };

  const updateConversationName = () => {
    setConfirmModal({
      title: 'Edit Group Name',
      message: `Change group name to "${newConvName}"?`,
      confirmText: 'Save',
      onConfirm: async () => {
        try {
          await api.patch(`/conversations/${id}/name`, { name: newConvName });
          await fetchConversation();
          setShowEditNameModal(false);
          setNewConvName('');
          showToast('Group name updated', 'success');
        } catch (err) {
          showToast('Failed to update group name', 'error');
        }
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const deleteConversation = () => {
    setConfirmModal({
      title: 'Delete Conversation',
      message: 'Permanently delete this conversation? This cannot be undone.',
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/conversations/${id}`);
          navigate('/messages');
          showToast('Conversation deleted', 'success');
        } catch (err) {
          showToast('Failed to delete conversation', 'error');
        }
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const leaveConversation = () => {
    setConfirmModal({
      title: 'Leave Conversation',
      message: 'Are you sure you want to leave this conversation?',
      confirmText: 'Leave',
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/conversations/${id}/members/me`);
          navigate('/messages');
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to leave conversation', 'error');
        }
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const kickMember = (memberId, memberName) => {
    setConfirmModal({
      title: 'Remove Member',
      message: `Remove ${memberName} from this conversation?`,
      confirmText: 'Remove',
      danger: true,
      onConfirm: async () => {
        try {
          await api.delete(`/conversations/${id}/members/${memberId}`);
          await fetchConversation();
          showToast('Member removed successfully', 'success');
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to remove member', 'error');
        }
        setConfirmModal(null);
      },
      onCancel: () => setConfirmModal(null)
    });
  };

  const copyInviteCode = () => {
    if (conversation?.inviteCode) {
      navigator.clipboard.writeText(conversation.inviteCode);
      showToast('Invite code copied to clipboard', 'success');
    }
  };

  const getConvName = () => {
    if (!conversation) return 'Conversation';
    if (conversation.type === 'group') return conversation.name || 'Group Chat';
    const other = conversation.members?.find(m => m.userId !== user?.id);
    return other ? `${other.firstName} ${other.lastName}` : 'Direct Message';
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    return '📎';
  };

  const isImage = (mimeType) => {
    if (!mimeType) return false; // Handle null/undefined
    return mimeType.startsWith('image/');
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getEventText = (event) => {
    if (event.eventType === 'member_joined') {
      return `${event.userName} joined the conversation`;
    }
    if (event.triggeredByName) {
      return `${event.userName} was removed by ${event.triggeredByName}`;
    }
    return `${event.userName} left the conversation`;
  };

  const fmt = (dt) => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (dt) => {
    const d = new Date(dt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const initials = (name) =>
    name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  // Merge messages and events for chronological display
  const timeline = [...messages, ...events].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  let lastDate = null;

  const statusIndicator = {
    connected: { icon: '🟢', text: 'Connected' },
    connecting: { icon: '🟡', text: 'Connecting...' },
    disconnected: { icon: '🔴', text: 'Disconnected' }
  }[wsStatus];

  return (
    <>
      <Navbar />
      <div className="chat-root">
        {/* Header */}
        <div className="chat-header">
          <button className="chat-back-btn" onClick={() => navigate('/messages')}>
            ← Back
          </button>
          <div className="chat-header-avatar">💬</div>
          <div className="chat-header-info">
            <div className="chat-header-name">{getConvName()}</div>
            <div className="chat-header-sub">
              {conversation?.type === 'group' && conversation?.inviteCode && (
                <span 
                  style={{ cursor: 'pointer', fontWeight: 600 }}
                  onClick={copyInviteCode}
                  title="Click to copy"
                >
                  Code: {conversation.inviteCode} 📋
                </span>
              )}
              {!conversation?.inviteCode && `${messages.length} messages`}
            </div>
          </div>
          
          <div className="ws-status" title={statusIndicator.text}>
            {statusIndicator.icon}
          </div>

          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setShowMenu(!showMenu)}
            >
              ⋮
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                {conversation?.type === 'group' && (
                  <>
                    <button onClick={() => { setShowMembersModal(true); setShowMenu(false); }}>
                      👥 Members ({conversation?.members?.length || 0})
                    </button>
                    {conversation?.inviteCode && (
                      <button onClick={() => { copyInviteCode(); setShowMenu(false); }}>
                        📋 Copy Invite Code
                      </button>
                    )}
                    {isTeacherOrAdmin && (
                      <button onClick={() => { 
                        setNewConvName(conversation.name || '');
                        setShowEditNameModal(true); 
                        setShowMenu(false); 
                      }}>
                        ✏️ Edit Group Name
                      </button>
                    )}
                  </>
                )}

                {isTeacherOrAdmin && (
                  <button 
                    onClick={() => { deleteConversation(); setShowMenu(false); }} 
                    style={{ color: 'var(--red)' }}
                  >
                    🗑️ Delete Conversation
                  </button>
                )}
                <button onClick={() => { leaveConversation(); setShowMenu(false); }} style={{ color: 'var(--red)' }}>
                  🚪 Leave Conversation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="chat-body">
          {loading ? (
            <p className="loading">Loading messages…</p>
          ) : timeline.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">👋</div>
              <p>Start the conversation!</p>
            </div>
          ) : (
            timeline.map((item) => {
              // Check if it's an event or message
              if (item.eventType) {
                // It's an event
                const d = fmtDate(item.createdAt);
                const showDate = d !== lastDate;
                lastDate = d;

                return (
                  <div key={`event-${item.id}`}>
                    {showDate && <div className="chat-date">{d}</div>}
                    <div className="chat-event">
                      {getEventText(item)}
                    </div>
                  </div>
                );
              }

              // It's a message
              const msg = item;
              const isMine = msg.senderId === user?.id;
              const d = fmtDate(msg.createdAt);
              const showDate = d !== lastDate;
              lastDate = d;
              const isEditing = editingMessageId === msg.id;
              const isHovered = hoveredMessageId === msg.id;

              return (
                <div key={msg.id}>
                  {showDate && <div className="chat-date">{d}</div>}
                  <div 
                    className={`msg-row ${isMine ? 'mine' : 'theirs'}`}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    {!isMine && (
                      <div className="msg-sender-avatar">
                        {initials(msg.senderName)}
                      </div>
                    )}
                    <div className="msg-bubble">
                      {!isMine && (
                        <span className="msg-sender-name">{msg.senderName}</span>
                      )}
                      
                      {isEditing ? (
                        <div className="msg-edit-container">
                          <input
                            className="msg-edit-input"
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                saveEditMessage(msg.id);
                              }
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                          />
                          <div className="msg-edit-actions">
                            <button className="btn-edit-save" onClick={() => saveEditMessage(msg.id)}>
                              Save
                            </button>
                            <button className="btn-edit-cancel" onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {msg.content && <p className="msg-text">{msg.content}</p>}
                          
                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="msg-attachments">
                              {msg.attachments.map(att => (
                                <div key={att.id} className="attachment-card">
                                  {isImage(att.mimeType) ? (
                                    <div 
                                      className="attachment-thumbnail"
                                      onClick={() => openImagePreview(att.id, att.fileName)}
                                    >
                                      {imageBlobUrls[att.id] ? (
                                        <img 
                                          src={imageBlobUrls[att.id]}
                                          alt={att.fileName}
                                        />
                                      ) : (
                                        <div className="loading-placeholder">Loading...</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="attachment-file">
                                      <div className="attachment-icon">{getFileIcon(att.mimeType)}</div>
                                      <div className="attachment-info">
                                        <div className="attachment-name">{att.fileName}</div>
                                        <div className="attachment-size">{formatFileSize(att.fileSize)}</div>
                                      </div>
                                      <button 
                                        className="attachment-download"
                                        onClick={() => downloadAttachment(att.id, att.fileName)}
                                      >
                                        ⬇️
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {msg.edited && (
                            <span className="msg-edited-tag">edited</span>
                          )}
                        </>
                      )}
                      
                      <div className="msg-time">
                        {fmt(msg.createdAt)}
                        {isMine && <span>{msg.isRead ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>

                    {isMine && isHovered && !isEditing && (
                      <div className="msg-actions">
                        <button 
                          className="msg-action-btn"
                          onClick={() => startEditMessage(msg)}
                          title="Edit message"
                        >
                          ✏️
                        </button>
                        <button 
                          className="msg-action-btn"
                          onClick={() => deleteMessage(msg.id, msg.content)}
                          title="Delete message"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* File Preview */}
        {selectedFiles.length > 0 && (
          <div className="file-preview-bar">
            <div className="file-preview-label">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
            </div>
            <div className="file-preview-list">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="file-preview-item">
                  <span>{file.name}</span>
                  <button onClick={() => removeFile(idx)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form className="chat-footer" onSubmit={send}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="chat-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Attach files"
          >
            📎
          </button>
          <input
            ref={inputRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Type a message…"
            disabled={uploading}
            autoFocus
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={(!content.trim() && selectedFiles.length === 0) || uploading}
            aria-label="Send message"
          >
            {uploading ? '⏳' : '➤'}
          </button>
        </form>
      </div>

      {/* Edit Group Name Modal */}
      {showEditNameModal && (
        <div className="modal-backdrop" onClick={() => setShowEditNameModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Edit Group Name</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowEditNameModal(false)}>✕</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  value={newConvName}
                  onChange={e => setNewConvName(e.target.value)}
                  placeholder="Enter new group name"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowEditNameModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={updateConversationName}
                disabled={!newConvName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && conversation?.type === 'group' && (
        <div className="modal-backdrop" onClick={() => setShowMembersModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Group Members</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowMembersModal(false)}>✕</button>
            </div>
            <div style={{ padding: '1rem' }}>
              {conversation.members?.map(member => (
                <div key={member.userId} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {member.firstName} {member.lastName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {member.role}
                    </div>
                  </div>
                  {isTeacherOrAdmin && member.role === 'STUDENT' && member.userId !== user?.id && (
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => kickMember(member.userId, `${member.firstName} ${member.lastName}`)}
                      style={{ color: 'var(--red)' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <ImagePreviewModal
          url={imagePreview.url}
          fileName={imagePreview.fileName}
          onClose={() => setImagePreview(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Confirm Modal */}
      {confirmModal && <ConfirmModal {...confirmModal} />}
    </>
  );
}