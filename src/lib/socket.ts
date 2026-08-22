import { io, Socket } from 'socket.io-client';
import { Message } from '../types';
import { normalizeMessage } from './normalize';

const SOCKET_ORIGIN = 'https://frontend-task-chatapp.onrender.com';

let socket: Socket | null = null;

export type SocketStatus = 'connecting' | 'connected' | 'disconnected';

type StatusListener = (status: SocketStatus) => void;

let statusListener: StatusListener | null = null;

export const onSocketStatus = (listener: StatusListener | null) => {
  statusListener = listener;
};

const emitStatus = (status: SocketStatus) => statusListener?.(status);

export const initSocket = (token: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  emitStatus('connecting');

  socket = io(SOCKET_ORIGIN, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => emitStatus('connected'));
  socket.on('disconnect', () => emitStatus('disconnected'));
  socket.io.on('reconnect_attempt', () => emitStatus('connecting'));
  socket.on('connect_error', () => emitStatus('disconnected'));

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  emitStatus('disconnected');
};

/**
 * Subscribes to inbound message frames.
 *
 * The server broadcasts `message:new` only to participants *other* than the
 * author, so a sender never receives an echo of their own message and the
 * optimistic bubble is the single source of truth for outbound sends.
 *
 * Sending is REST-only: the gateway does not accept an outbound `message:send`
 * frame, and `POST /messages` is what triggers the broadcast.
 *
 * Note the frame differs from the REST body — it uses `id` (not `_id`) and an
 * epoch-millisecond `createdAt` — so it goes through the same normalizer.
 */
export const subscribeToSocketEvents = (onNewMessage: (msg: Message) => void) => {
  if (!socket) return;

  socket.off('message:new');
  socket.on('message:new', (raw: unknown) => {
    const message = normalizeMessage(raw as Record<string, unknown>);
    if (!message.id || !message.conversationId) return;
    onNewMessage(message);
  });
};
