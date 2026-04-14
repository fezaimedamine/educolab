import { Client } from '@stomp/stompjs';

export const createWebSocketClient = (token, onConnect, onDisconnect) => {
  const client = new Client({
    brokerURL: 'ws://localhost:8080/ws', // Direct WebSocket (no SockJS)
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    
    onConnect: () => {
      console.log('✅ WebSocket connected');
      onConnect?.();
    },
    
    onDisconnect: () => {
      console.log('❌ WebSocket disconnected');
      onDisconnect?.();
    },
    
    onStompError: (frame) => {
      console.error('❌ STOMP error:', frame);
    }
  });

  return client;
};