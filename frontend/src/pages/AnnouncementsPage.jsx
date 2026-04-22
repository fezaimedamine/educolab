import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  Megaphone, Clock, AlertTriangle, Calendar, Paperclip, 
  Bookmark, ThumbsUp, MessageSquare, Filter, Sparkles, 
  CheckCircle, Search, Pin, X, Send, BookOpen, ChevronDown, ChevronUp, BellRing
} from 'lucide-react';
import './AnnouncementsPage.css';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('All');
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ 
    title: '', content: '', targetGroup: '', courseName: '', deadline: '', tags: [], selectedFiles: [], summary: '' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Interactions (Local states for demo, in production store in DB)
  const [bookmarks, setBookmarks] = useState(new Set());
  const [likes, setLikes] = useState(new Set());
  const [readPosts, setReadPosts] = useState(new Set());
  const [expandedText, setExpandedText] = useState(new Set());

  // Comments State
  const [comments, setComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [showComments, setShowComments] = useState({});
  
  const canCreate = user?.role !== 'student';
  const availableTags = ['Urgent', 'Important', 'Exam', 'Assignment', 'Event', 'General'];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/announcements'),
      api.get('/announcements/read-status').catch(() => ({ data: [] }))
    ]).then(([announcementsRes, readStatusRes]) => {
      setAnnouncements(announcementsRes.data);
      setReadPosts(new Set(readStatusRes.data));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // simulate an AI summary if empty
      let finalSummary = form.summary;
      if (!finalSummary) {
        finalSummary = form.content.length > 50 ? form.content.substring(0, 50) + "..." : form.content;
      }
      
      const uploadedAttachments = [];
      for (const file of form.selectedFiles) {
        const fd = new FormData();
        fd.append('file', file);
        const { data } = await api.post('/files/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedAttachments.push(data); // { url, name }
      }
      
      const { selectedFiles, ...formWithoutFiles } = form;

      const payload = { 
        ...formWithoutFiles, 
        targetGroup: form.targetGroup || null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        tags: form.tags.join(','),
        attachments: uploadedAttachments.length > 0 ? JSON.stringify(uploadedAttachments) : null,
        summary: finalSummary
      };
      const { data } = await api.post('/announcements', payload);
      setAnnouncements(prev => [data, ...prev]);
      setShowForm(false);
      setForm({ title: '', content: '', targetGroup: '', courseName: '', deadline: '', tags: [], selectedFiles: [], summary: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await api.delete(`/announcements/${id}`);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const toggleTag = (tag) => {
    setForm(f => {
      const tags = f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag];
      return { ...f, tags };
    });
  };

  const toggleBookmark = (id) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleLike = (id) => {
    setLikes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/announcements/${id}/read`);
      setReadPosts(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

  const toggleTextExpanded = (id) => {
    setExpandedText(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleComments = async (id) => {
    setShowComments(prev => ({ ...prev, [id]: !prev[id] }));
    if (!comments[id]) {
      try {
        const { data } = await api.get(`/announcements/${id}/comments`);
        setComments(prev => ({ ...prev, [id]: data }));
      } catch (err) {
        console.error('Failed to load comments');
      }
    }
  };

  const submitComment = async (id, e) => {
    e.preventDefault();
    const content = commentInputs[id];
    if (!content?.trim()) return;
    
    try {
      const { data } = await api.post(`/announcements/${id}/comments`, { content });
      setComments(prev => ({ ...prev, [id]: [...(prev[id] || []), data] }));
      setCommentInputs(prev => ({ ...prev, [id]: '' }));
    } catch (err) {
      console.error('Failed to post comment');
    }
  };

  const getTagColor = (tagStr) => {
    const t = tagStr.toLowerCase();
    if (t.includes('urgent')) return 'tag-urgent';
    if (t.includes('important')) return 'tag-important';
    if (t.includes('exam')) return 'tag-exam';
    if (t.includes('assignment')) return 'tag-assignment';
    if (t.includes('event')) return 'tag-event';
    return 'tag-general';
  };

  const fmt = (dt) => {
    if (!dt) return '';
    return new Date(dt).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredAnnouncements = useMemo(() => {
    let result = [...announcements];

    // Priority Sort (Urgent first)
    result.sort((a, b) => {
      const aUrgent = (a.tags || '').toLowerCase().includes('urgent');
      const bUrgent = (b.tags || '').toLowerCase().includes('urgent');
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(a => 
        (a.title || '').toLowerCase().includes(q) || 
        (a.courseName || '').toLowerCase().includes(q) ||
        (a.authorName || '').toLowerCase().includes(q)
      );
    }
    
    // Tag filter
    if (filterTag !== 'All') {
      result = result.filter(a => (a.tags || '').toLowerCase().includes(filterTag.toLowerCase()));
    }

    // Hide read posts UNLESS searching
    if (!searchTerm) {
      result = result.filter(a => !readPosts.has(a.id));
    }

    return result;
  }, [announcements, searchTerm, filterTag]);

  return (
    <>
      <Navbar />
      <main className="announcements-page">
        {/* Header Section */}
        <section className="ap-header">
          <div className="ap-header-content">
            <h1 className="ap-title">Campus Announcements</h1>
            <p className="ap-subtitle">Your academic social feed. Stay informed, never miss a beat.</p>
          </div>
          <div className="ap-header-actions">
            {canCreate && (
              <button 
                className={`btn ap-create-btn ${showForm ? 'open' : ''}`}
                onClick={() => { setShowForm(v => !v); setError(''); }}
              >
                {showForm ? <><X size={18}/> Cancel</> : <><Megaphone size={18}/> <span>Post Announcement</span></>}
              </button>
            )}
          </div>
        </section>

        {/* Create Form Modal/Panel */}
        {showForm && (
          <div className="ap-form-panel">
            <div className="ap-form-header">
              <h3><Megaphone /> Create New Post</h3>
            </div>
            <form onSubmit={handleCreate}>
              <div className="ap-form-grid">
                <div className="ap-form-group span-full">
                  <label>Title</label>
                  <input placeholder="e.g. Midterm date changed" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                
                <div className="ap-form-group">
                  <label>Course / Module Name <span className="ap-optional">(Optional)</span></label>
                  <input placeholder="e.g. Software Engineering" value={form.courseName} onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))} />
                </div>
                
                <div className="ap-form-group">
                  <label>Deadline / Event Date <span className="ap-optional">(Optional)</span></label>
                  <input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>

                <div className="ap-form-group span-full">
                  <label>Content</label>
                  <textarea rows={5} placeholder="Write the full details here..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required />
                </div>

                <div className="ap-form-group span-full ap-tags-selector">
                  <label>Tags</label>
                  <div className="ap-tag-pills">
                    {availableTags.map(tag => (
                      <button type="button" key={tag} 
                        className={`ap-tag-pill ${form.tags.includes(tag) ? 'active ' + getTagColor(tag) : ''}`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ap-form-group">
                  <label>Attachments <span className="ap-optional">(PDF, CSV, Word...)</span></label>
                  <div className="ap-input-icon">
                    <Paperclip size={18} />
                    <input 
                      type="file" 
                      multiple 
                      onChange={e => setForm(f => ({ ...f, selectedFiles: Array.from(e.target.files) }))} 
                      style={{ paddingLeft: '2.75rem', paddingTop: '0.6rem' }}
                    />
                  </div>
                  {form.selectedFiles.length > 0 && (
                    <div className="ap-selected-files">
                      {form.selectedFiles.map((file, idx) => (
                        <span key={idx} className="ap-file-badge">📄 {file.name}</span>
                      ))}
                    </div>
                  )}
                </div>

                {user?.role !== 'student' && (
                  <div className="ap-form-group">
                    <label>Target Group <span className="ap-optional">(Empty = All)</span></label>
                    <input placeholder="e.g. G1" value={form.targetGroup} onChange={e => setForm(f => ({ ...f, targetGroup: e.target.value }))} />
                  </div>
                )}
              </div>
              {error && <p className="ap-error">{error}</p>}
              <div className="ap-form-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Discard</button>
                <button type="submit" className="btn btn-primary ap-publish-btn" disabled={submitting}>
                  {submitting ? 'Publishing...' : <><Send size={16} /> Publish Post</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Toolbar: Search and Filters */}
        <div className="ap-toolbar">
          <div className="ap-search-box">
            <Search size={18} />
            <input 
              placeholder="Search by title, course, or professor..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="ap-filters">
            <div className="ap-filter-dropdown">
              <Filter size={18}/>
              <select value={filterTag} onChange={e => setFilterTag(e.target.value)}>
                <option value="All">All Types</option>
                {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="ap-loading">
            <div className="ap-spinner"></div>
            <p>Gathering latest announcements...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-icon"><BellRing size={48} /></div>
            <h2>You're all caught up!</h2>
            <p>No announcements match your criteria right now.</p>
          </div>
        ) : (
          <div className="ap-feed">
            {filteredAnnouncements.map((a, i) => {
              const tagsArray = a.tags ? a.tags.split(',').map(t => t.trim()) : [];
              const isUrgent = tagsArray.some(t => t.toLowerCase() === 'urgent');
              const isExpanded = expandedText.has(a.id);
              const isRead = readPosts.has(a.id);
              
              // Simple truncation locally if no AI summary is present
              const contentPreview = a.content && a.content.length > 150 ? a.content.substring(0, 150) + '...' : a.content;
              const needsExpansion = a.content && a.content.length > 150;

              // Parse attachments
              let postAttachments = [];
              try {
                if (a.attachments) postAttachments = JSON.parse(a.attachments);
              } catch {
                if (a.attachments) postAttachments = [{ url: a.attachments, name: "View Attachment" }];
              }

              return (
                <article key={a.id} className={`ap-card ${isUrgent ? 'ap-card-urgent' : ''} ${isRead ? 'ap-card-read' : ''}`} style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}>
                  {isUrgent && <div className="ap-card-priority-strip"></div>}
                  
                  <div className="ap-card-top-actions">
                    <button className="ap-icon-btn" onClick={() => toggleBookmark(a.id)} aria-label="Bookmark">
                      <Bookmark size={18} fill={bookmarks.has(a.id) ? 'currentColor' : 'none'} color={bookmarks.has(a.id) ? 'var(--primary)' : 'var(--text-tertiary)'} />
                    </button>
                    {(user?.role === 'admin' || a.createdBy === user?.id) && (
                      <button className="ap-icon-btn ap-delete-btn" onClick={() => handleDelete(a.id)} aria-label="Delete">
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  <div className="ap-card-header">
                    <div className="ap-card-avatar">
                      {a.authorName ? a.authorName.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="ap-card-meta">
                      <div className="ap-card-author">{a.authorName || 'Staff Member'}</div>
                      <div className="ap-card-time">{fmt(a.createdAt)}</div>
                    </div>
                  </div>

                  <div className="ap-card-body">
                    {/* Tags & Context */}
                    <div className="ap-card-context">
                      {tagsArray.map(t => (
                        <span key={t} className={`ap-tag ${getTagColor(t)}`}>{t}</span>
                      ))}
                      {a.courseName && (
                        <span className="ap-course-badge"><BookOpen size={14}/> {a.courseName}</span>
                      )}
                      {a.targetGroup && (
                        <span className="ap-group-badge">Group: {a.targetGroup}</span>
                      )}
                    </div>

                    <h3 className="ap-card-title">{a.title}</h3>
                    
                    {/* AI Summary Block */}
                    {a.summary && (
                      <div className="ap-ai-summary">
                        <div className="ap-ai-header"><Sparkles size={14} /> AI Summary</div>
                        <p>{a.summary}</p>
                      </div>
                    )}

                    <div className="ap-card-content">
                      <p>{isExpanded ? a.content : contentPreview}</p>
                      {needsExpansion && (
                        <button className="ap-read-more" onClick={() => toggleTextExpanded(a.id)}>
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>

                    {/* Deadline & Attachments */}
                    <div className="ap-card-extras">
                      {a.deadline && (
                        <div className="ap-extra-item ap-deadline">
                          <Clock size={16} /> <strong>Deadline:</strong> {fmt(a.deadline)}
                        </div>
                      )}
                      {postAttachments.length > 0 && (
                        <div className="ap-extra-attachments">
                          {postAttachments.map((att, idx) => (
                            <div key={idx} className="ap-extra-item ap-attachment">
                              <Paperclip size={16} />
                              <a href={att.url.startsWith('http') || att.url.startsWith('/api') ? att.url : 'http://localhost:8080' + att.url} target="_blank" rel="noreferrer" className="ap-attachment-link">{att.name}</a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ap-card-footer">
                    <div className="ap-interactions">
                      <button className={`ap-interact-btn ${likes.has(a.id) ? 'liked' : ''}`} onClick={() => toggleLike(a.id)}>
                        <ThumbsUp size={16} /> {likes.has(a.id) ? 'Liked' : 'Like'}
                      </button>
                      <button className="ap-interact-btn" onClick={() => toggleComments(a.id)}>
                        <MessageSquare size={16} /> Comment ({comments[a.id]?.length || 0})
                      </button>
                    </div>
                    
                    <div className="ap-read-status">
                      {!isRead ? (
                        <button className="ap-mark-read-btn" onClick={() => markAsRead(a.id)}>
                          <CheckCircle size={14} /> Mark as read
                        </button>
                      ) : (
                        <span className="ap-read-badge"><CheckCircle size={14} /> Read</span>
                      )}
                    </div>
                  </div>

                  {/* Comment Section */}
                  {showComments[a.id] && (
                    <div className="ap-comments-section">
                      <div className="ap-comments-list">
                        {(comments[a.id] || []).length === 0 ? (
                          <p className="ap-no-comments">No comments yet. Be the first!</p>
                        ) : (
                          (comments[a.id] || []).map(c => (
                            <div key={c.id} className="ap-comment-item">
                              <div className="ap-comment-avatar">{c.authorName ? c.authorName.charAt(0).toUpperCase() : '👤'}</div>
                              <div className="ap-comment-content">
                                <div className="ap-comment-header">
                                  <span className="ap-comment-author">{c.authorName || 'Staff Member'}</span>
                                  <span className="ap-comment-time">{fmt(c.createdAt)}</span>
                                </div>
                                <p className="ap-comment-text">{c.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <form className="ap-comment-form" onSubmit={(e) => submitComment(a.id, e)}>
                        <input
                          placeholder="Write a comment..."
                          value={commentInputs[a.id] || ''}
                          onChange={e => setCommentInputs(prev => ({ ...prev, [a.id]: e.target.value }))}
                        />
                        <button type="submit" disabled={!commentInputs[a.id]?.trim()} className="btn btn-primary btn-sm">
                          Reply
                        </button>
                      </form>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
