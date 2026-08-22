import { create } from 'zustand';
import { Conversation, Message, User } from '../types';
import { apiService } from '../lib/api-client';
import { emitSocketMessage } from '../lib/socket';

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  searchQuery: string;
  messageSearchQuery: string;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  isOnline: boolean;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setMessageSearchQuery: (query: string) => void;
  setActiveConversation: (id: string) => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string, currentUser: User) => Promise<void>;
  receiveSocketMessage: (msg: Message) => void;
  updateConversationFromSocket: (conv: Conversation) => void;
  startDirectConversation: (userId: string) => Promise<string>;
  createGroupConversation: (name: string, participantIds: string[]) => Promise<string>;
  setIsOnline: (online: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  searchQuery: '',
  messageSearchQuery: '',
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,
  isOnline: true,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setMessageSearchQuery: (query) => set({ messageSearchQuery: query }),
  setIsOnline: (online) => set({ isOnline: online }),

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const convs = await apiService.getConversations();
      const safeConvs = Array.isArray(convs) ? convs : [];
      set({ conversations: safeConvs, isLoadingConversations: false });
      if (safeConvs.length > 0 && !get().activeConversationId) {
        get().setActiveConversation(safeConvs[0].id);
      }
    } catch {
      set({ isLoadingConversations: false });
    }
  },

  setActiveConversation: async (id: string) => {
    set({ activeConversationId: id, messageSearchQuery: '' });
    // Reset unread count for this conversation
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c
      ),
    }));
    await get().fetchMessages(id);
  },

  fetchMessages: async (conversationId: string) => {
    if (!get().messages[conversationId]) {
      set({ isLoadingMessages: true });
    }
    try {
      const msgList = await apiService.getMessages(conversationId);
      set((state) => ({
        messages: { ...state.messages, [conversationId]: msgList },
        isLoadingMessages: false,
      }));
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (conversationId: string, text: string, currentUser: User) => {
    if (!text.trim()) return;

    const clientTempId = `temp_${Date.now()}`;
    const optimisticMsg: Message = {
      id: clientTempId,
      conversationId,
      senderId: currentUser.id,
      sender: currentUser,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      status: 'sending',
      clientTempId,
    };

    // Append optimistic message immediately
    set((state) => {
      const currentMsgs = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...currentMsgs, optimisticMsg],
        },
      };
    });

    // Try transmitting over WebSocket first
    emitSocketMessage(conversationId, text.trim());

    try {
      const actualMsg = await apiService.sendMessage(conversationId, text.trim(), clientTempId);

      // Reconcile optimistic message with finalized server response
      set((state) => {
        const msgs = (state.messages[conversationId] || []).map((m) =>
          m.clientTempId === clientTempId || m.id === clientTempId ? { ...actualMsg, status: 'sent' as const } : m
        );
        return {
          messages: { ...state.messages, [conversationId]: msgs },
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, lastMessage: actualMsg, updatedAt: actualMsg.createdAt } : c
          ),
        };
      });
    } catch {
      // Mark as failed if send throws
      set((state) => {
        const msgs = (state.messages[conversationId] || []).map((m) =>
          m.clientTempId === clientTempId ? { ...m, status: 'failed' as const } : m
        );
        return {
          messages: { ...state.messages, [conversationId]: msgs },
        };
      });
    }
  },

  receiveSocketMessage: (msg: Message) => {
    const { activeConversationId, conversations } = get();
    const isCurrentActive = activeConversationId === msg.conversationId;

    set((state) => {
      const currentMsgs = state.messages[msg.conversationId] || [];
      // Deduplicate if already present via optimistic update
      const exists = currentMsgs.some(
        (m) => m.id === msg.id || (m.clientTempId && m.clientTempId === msg.clientTempId)
      );

      const updatedMsgs = exists
        ? currentMsgs.map((m) => (m.clientTempId === msg.clientTempId ? msg : m))
        : [...currentMsgs, msg];

      const updatedConvs = conversations.map((c) => {
        if (c.id === msg.conversationId) {
          return {
            ...c,
            lastMessage: msg,
            updatedAt: msg.createdAt,
            unreadCount: !isCurrentActive ? (c.unreadCount || 0) + 1 : 0,
          };
        }
        return c;
      });

      return {
        messages: { ...state.messages, [msg.conversationId]: updatedMsgs },
        conversations: updatedConvs,
      };
    });
  },

  updateConversationFromSocket: (conv: Conversation) => {
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conv.id);
      return {
        conversations: exists
          ? state.conversations.map((c) => (c.id === conv.id ? conv : c))
          : [conv, ...state.conversations],
      };
    });
  },

  startDirectConversation: async (userId: string) => {
    const conv = await apiService.startDirectConversation(userId);
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conv.id);
      return {
        conversations: exists ? state.conversations : [conv, ...state.conversations],
        activeConversationId: conv.id,
      };
    });
    await get().fetchMessages(conv.id);
    return conv.id;
  },

  createGroupConversation: async (name: string, participantIds: string[]) => {
    const conv = await apiService.createGroup(name, participantIds);
    set((state) => ({
      conversations: [conv, ...state.conversations],
      activeConversationId: conv.id,
    }));
    await get().fetchMessages(conv.id);
    return conv.id;
  },
}));
