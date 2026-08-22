export interface User {
  id: string;
  phone: string;
  name: string;
  avatarUrl?: string;
  createdAt?: string;
}

export type ConversationType = 'direct' | 'group';

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string | null;
  participants: User[];
  adminIds?: string[];
  lastMessage?: Message | null;
  updatedAt: string;
  unreadCount?: number;
}

export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  text: string;
  createdAt: string;
  status?: MessageStatus;
  /** Correlates an optimistic bubble with its server-confirmed counterpart. */
  clientTempId?: string;
  /** Populated when `status === 'failed'`, for the inline retry affordance. */
  error?: string;
}

export type LatencyOption = 20 | 300 | 1500;
export type ProtocolOption = 'WebSocket' | 'SSE' | 'Auto-Polling';

export interface TelemetryMetrics {
  rttMs: number;
  optimisticRenderMs: number;
  packetsSent: number;
  packetsReceived: number;
  syncStatus: 'Synchronized' | 'Queueing' | 'Reconnecting' | 'Syncing...';
}
