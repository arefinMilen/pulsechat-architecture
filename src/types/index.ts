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
  clientTempId?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SearchUsersResponse {
  users: User[];
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // conversationId -> Message[]
  searchQuery: string;
  messageSearchQuery: string;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  isOnline: boolean;
}

export interface SocketMessageNewEvent {
  message: Message;
}

export interface SocketConversationUpdatedEvent {
  conversation: Conversation;
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
