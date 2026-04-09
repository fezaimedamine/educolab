import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './ChatPage.css';

export default function ChatPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [convName, setConvName] = useState('Conversation');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/conversations/${id}/messages`);
      setMessages([...data].reverse());
    } catch {
      navigate('/messages');
    }
  };

  useEffect(() => {
    // Fetch conversation details for name
    api.get('/conversations').then(r => {
      const conv = r.data.find(c => c.id === id);
      if (conv) {
        if (conv.type === 'group') {
          setConvName(conv.name || 'Group Chat');
        } else {
          const other = conv.members?.find(m => m.userId !== user?.id);
          if (other) setConvName(`${other.firstName} ${other.lastName}`);
        }
      }
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    fetchMessages().finally(() => setLoading(false));
    const t = setInterval(fetchMessages, 4000);
    return () => clearInterval(t);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    try {
      const { data } = await api.post(`/conversations/${id}/messages`, { content: trimmed });
      setMessages(prev => [...prev, data]);
      setContent('');
      inputRef.current?.focus();
    } catch (err) { console.error(err); }
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

  let lastDate = null;

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
            <div className="chat-header-name">{convName}</div>
            <div className="chat-header-sub">{messages.length} messages</div>
          </div>
        </div>

        {/* Body */}
        <div className="chat-body">
          {loading ? (
            <p className="loading">Loading messages…</p>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">👋</div>
              <p>Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === user?.id;
              const d = fmtDate(msg.createdAt);
              const showDate = d !== lastDate;
              lastDate = d;

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="chat-date">{d}</div>
                  )}
                  <div className={`msg-row ${isMine ? 'mine' : 'theirs'}`}>
                    {!isMine && (
                      <div className="msg-sender-avatar">
                        {initials(msg.senderName)}
                      </div>
                    )}
                    <div className="msg-bubble">
                      {!isMine && (
                        <span className="msg-sender-name">{msg.senderName}</span>
                      )}
                      <p className="msg-text">{msg.content}</p>
                      <div className="msg-time">
                        {fmt(msg.createdAt)}
                        {isMine && <span>{msg.isRead ? '✓✓' : '✓'}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form className="chat-footer" onSubmit={send}>
          <input
            ref={inputRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Type a message…"
            autoFocus
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!content.trim()}
            aria-label="Send message"
          >
            ➤
          </button>
        </form>
      </div>
    </>
  );
}
