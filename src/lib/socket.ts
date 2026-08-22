import { io, Socket } from 'socket.io-client';
import { Message, Conversation } from '../types';

let socket: Socket | null = null;

export const initSocket = (token: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  socket = io('https://frontend-task-chatapp.onrender.com', {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket.io Connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket connection error (fallback mode active):', err.message);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitSocketMessage = (conversationId: string, text: string) => {
  if (socket && socket.connected) {
    socket.emit('message:send', { conversationId, text });
  }
};

export const subscribeToSocketEvents = (
  onNewMessage: (msg: Message) => void,
  onConversationUpdated: (conv: Conversation) => void
) => {
  if (!socket) return;

  socket.off('message:new');
  socket.off('conversation:updated');

  socket.on('message:new', (msg: Message) => {
    onNewMessage(msg);
  });

  socket.on('conversation:updated', (conv: Conversation) => {
    onConversationUpdated(conv);
  });
};
