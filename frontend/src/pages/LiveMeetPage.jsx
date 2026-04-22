import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Peer } from 'peerjs';
import './LiveMeetPage.css';
import { 
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, 
  MessageSquare, Users, Hand, MoreVertical, ShieldAlert, Paperclip
} from 'lucide-react';

const VideoPlayer = ({ stream, setMuted }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={ref} autoPlay playsInline className="meet-video-elem" />;
};

export default function LiveMeetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stream, setStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  
  const [tab, setTab] = useState('chat');
  const [chatMsgs, setChatMsgs] = useState([
    { author: 'System', text: `Welcome to meeting: ${id}. Connection uses WebRTC.`, time: 'Now' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const [remotePeers, setRemotePeers] = useState({});
  const videoRef = useRef(null);
  const myPeerIdRef = useRef(null);
  const peerInstanceRef = useRef(null);
  const callsRef = useRef({}); // keep track of answered or incoming calls

  // Initialize Camera & Peer
  useEffect(() => {
    let s = null;
    let peer = null;

    async function init() {
      try {
        s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }

        peer = new Peer(undefined, { debug: 1 });
        peerInstanceRef.current = peer;

        peer.on('open', (peerId) => {
          myPeerIdRef.current = peerId;
          api.post(`/meetings/${id}/join-live`, { peerId });
        });

        // Answer incoming calls
        peer.on('call', (call) => {
          call.answer(s); // Answer with our local stream
          callsRef.current[call.peer] = call;
          
          call.on('stream', (remoteStream) => {
            setRemotePeers(prev => ({
              ...prev, 
              [call.peer]: { stream: remoteStream, name: 'Student...' }
            }));
          });

          call.on('close', () => {
            setRemotePeers(prev => { const n = {...prev}; delete n[call.peer]; return n; });
            delete callsRef.current[call.peer];
          });
        });

      } catch (err) {
        console.error("Media error or PeerJS failed:", err);
        setCamOn(false);
        setMicOn(false);
      }
    }
    init();

    return () => {
      if (s) s.getTracks().forEach(t => t.stop());
      if (peer) peer.destroy();
      api.post(`/meetings/${id}/leave-live`).catch(()=>{});
    };
  }, [id]);

  // Polling signaling server for mesh connection
  useEffect(() => {
    const poll = setInterval(async () => {
      if (!myPeerIdRef.current || !stream || !peerInstanceRef.current) return;
      try {
        const { data } = await api.get(`/meetings/${id}/live-participants`);
        
        data.forEach(p => {
          if (p.peerId !== myPeerIdRef.current) {
            // Unseen peer -> Call them
            if (!callsRef.current[p.peerId]) {
              callsRef.current[p.peerId] = true; // mark trying
              
              const call = peerInstanceRef.current.call(p.peerId, stream);
              if (call) {
                callsRef.current[p.peerId] = call;
                call.on('stream', (remoteStream) => {
                  setRemotePeers(prev => ({
                    ...prev, 
                    [p.peerId]: { stream: remoteStream, name: `${p.firstName} ${p.lastName}` }
                  }));
                });
                call.on('close', () => {
                  setRemotePeers(prev => { const n = {...prev}; delete n[p.peerId]; return n; });
                  delete callsRef.current[p.peerId];
                });
                call.on('error', () => {
                  delete callsRef.current[p.peerId];
                });
              } else {
                 delete callsRef.current[p.peerId];
              }
            } else {
              // Update name if we were waiting for it
              setRemotePeers(prev => {
                if (prev[p.peerId] && prev[p.peerId].name === 'Student...') {
                  return { ...prev, [p.peerId]: { ...prev[p.peerId], name: `${p.firstName} ${p.lastName}` } };
                }
                return prev;
              });
            }
          }
        });
      } catch(e) {}
    }, 2000);

    return () => clearInterval(poll);
  }, [stream, id]);

  // Update track enabled state
  useEffect(() => {
    if (stream) {
      stream.getAudioTracks().forEach(t => t.enabled = micOn);
      stream.getVideoTracks().forEach(t => t.enabled = camOn);
    }
  }, [micOn, camOn, stream]);

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = displayStream;
        
        // Let remote peers see the screen share too!
        const screenTrack = displayStream.getVideoTracks()[0];
        Object.values(callsRef.current).forEach(call => {
           if (call.peerConnection) {
              const sender = call.peerConnection.getSenders().find(s => s.track.kind === 'video');
              if (sender) sender.replaceTrack(screenTrack);
           }
        });

        setScreenSharing(true);
        screenTrack.onended = () => {
           if (videoRef.current) videoRef.current.srcObject = stream;
           
           // Restore original camera track
           const camTrack = stream.getVideoTracks()[0];
           Object.values(callsRef.current).forEach(call => {
              if (call.peerConnection) {
                 const sender = call.peerConnection.getSenders().find(s => s.track.kind === 'video');
                 if (sender) sender.replaceTrack(camTrack);
              }
           });
           setScreenSharing(false);
        };
      } catch (e) { console.warn("Screen share cancelled", e); }
    } else {
       if (videoRef.current) videoRef.current.srcObject = stream;
       const camTrack = stream.getVideoTracks()[0];
       Object.values(callsRef.current).forEach(call => {
          if (call.peerConnection) {
             const sender = call.peerConnection.getSenders().find(s => s.track.kind === 'video');
             if (sender) sender.replaceTrack(camTrack);
          }
       });
       setScreenSharing(false);
    }
  };

  const leave = () => {
    navigate('/meetings');
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMsgs(p => [...p, { author: user?.firstName || 'Me', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }) }]);
    setChatInput('');
  };

  return (
    <div className="meet-container">
      {/* Top Navbar */}
      <div className="meet-topbar">
         <div className="meet-info">
           <ShieldAlert size={18} /> 
           <span>Room: {id}</span>
         </div>
      </div>

      <div className="meet-main">
        {/* Video Area Grid */}
        <div className="meet-video-area">
          <div className="meet-grid">
             {/* Local Video */}
             <div className="meet-video-cell local-cell">
               {camOn ? (
                 <video ref={videoRef} autoPlay playsInline muted className="meet-video-elem" />
               ) : (
                 <div className="meet-avatar-placeholder">
                   <div className="meet-avatar-circle">{user?.firstName?.[0] || '?'}</div>
                 </div>
               )}
               <div className="meet-cell-badge">
                 {!micOn && <span className="badge-icon red"><MicOff size={14}/></span>}
                 <span className="badge-name">You {handRaised && '🖐️'}</span>
               </div>
             </div>

             {/* Remote Peers using PeerJS streams */}
             {Object.entries(remotePeers).map(([peerId, data]) => (
                <div key={peerId} className="meet-video-cell remote-cell">
                   <VideoPlayer stream={data.stream} />
                   <div className="meet-cell-badge">
                     <span className="badge-name">{data.name}</span>
                   </div>
                </div>
             ))}
          </div>
        </div>

        {/* Right Sidebar */}
        {tab && (
          <div className="meet-sidebar">
             <div className="meet-sidebar-header">
               <h3>{tab === 'chat' ? 'In-call messages' : 'People'}</h3>
               <button className="meet-close-sidebar" onClick={() => setTab(null)}>✕</button>
             </div>
             
             {tab === 'chat' ? (
                <>
                  <div className="meet-chat-alert">Messages can only be seen by people in the call and are deleted when the call ends.</div>
                  <div className="meet-chat-list">
                    {chatMsgs.map((msg, i) => (
                      <div key={i} className="meet-chat-msg">
                        <div className="meet-chat-meta"><strong>{msg.author}</strong> <span>{msg.time}</span></div>
                        <div className="meet-chat-text">{msg.text}</div>
                      </div>
                    ))}
                  </div>
                  <form className="meet-chat-form" onSubmit={sendChat}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Send a message to everyone" />
                    <button type="submit" disabled={!chatInput.trim()}><MessageSquare size={16}/></button>
                  </form>
                </>
             ) : (
               <div className="meet-people-list">
                 <div className="meet-person">
                   <div className="person-av" style={{background:'#2563eb'}}>{user?.firstName?.[0]||'Me'}</div> 
                   {user?.firstName} (You)
                 </div>
                 {Object.entries(remotePeers).map(([peerId, data]) => (
                   <div key={peerId} className="meet-person">
                     <div className="person-av">{data.name[0] || 'S'}</div> 
                     {data.name}
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="meet-bottom-bar">
         <div className="meet-bottom-left">
           <span className="meet-time">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
           <span className="meet-divider">|</span>
           <span className="meet-code">{id}</span>
         </div>
         
         <div className="meet-bottom-center">
            <button className={`meet-ctrl-btn ${!micOn ? 'danger' : ''}`} onClick={() => setMicOn(!micOn)}>
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button className={`meet-ctrl-btn ${!camOn ? 'danger' : ''}`} onClick={() => setCamOn(!camOn)}>
              {camOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button className={`meet-ctrl-btn ${screenSharing ? 'active' : ''}`} onClick={toggleScreenShare}>
              <MonitorUp size={20} />
            </button>
            <button className={`meet-ctrl-btn ${handRaised ? 'active' : ''}`} onClick={() => setHandRaised(!handRaised)}>
              <Hand size={20} />
            </button>
            <button className="meet-ctrl-btn"><MoreVertical size={20} /></button>
            <button className="meet-ctrl-btn leave-btn" onClick={leave}>
              <PhoneOff size={20} />
            </button>
         </div>

         <div className="meet-bottom-right">
            <button className="meet-side-btn" onClick={() => {/* File Sharing */}}><Paperclip size={20} /></button>
            <button className={`meet-side-btn ${tab === 'people' ? 'active-text' : ''}`} onClick={() => setTab(t => t === 'people' ? null : 'people')}>
              <Users size={20} />
            </button>
            <button className={`meet-side-btn ${tab === 'chat' ? 'active-text' : ''}`} onClick={() => setTab(t => t === 'chat' ? null : 'chat')}>
              <MessageSquare size={20} />
            </button>
         </div>
      </div>
    </div>
  );
}
