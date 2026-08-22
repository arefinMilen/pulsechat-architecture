import { create } from 'zustand';
import { Conversation, Message, User } from '../types';
import { apiService } from '../lib/api-client';
import { apiError } from '../lib/normalize';
import { SocketStatus } from '../lib/socket';

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  searchQuery: string;
  messageSearchQuery: string;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  conversationsError: string | null;
  messagesError: string | null;
  isOnline: boolean;
  socketStatus: SocketStatus;

  setSearchQuery: (query: string) => void;
  setMessageSearchQuery: (query: string) => void;
  setActiveConversation: (id: string) => Promise<void>;
  clearActiveConversation: () => void;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string, currentUser: User) => Promise<void>;
  retryMessage: (conversationId: string, clientTempId: string, currentUser: User) => Promise<void>;
  receiveSocketMessage: (msg: Message) => void;
  upsertConversation: (conv: Conversation) => void;
  startDirectConversation: (userId: string) => Promise<string>;
  createGroupConversation: (name: string, participantIds: string[]) => Promise<string>;
  setIsOnline: (online: boolean) => void;
  setSocketStatus: (status: SocketStatus) => void;
  reset: () => void;
}

const initialState = {
  conversations: [] as Conversation[],
  activeConversationId: null as string | null,
  messages: {} as Record<string, Message[]>,
  searchQuery: '',
  messageSearchQuery: '',
  isLoadingConversations: false,
  isLoadingMessages: false,
  conversationsError: null as string | null,
  messagesError: null as string | null,
  isOnline: true,
  socketStatus: 'connecting' as SocketStatus,
};

/** Newest conversation first, matching the API's own ordering. */
const byRecency = (a: Conversation, b: Conversation) =>
  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

export const useChatStore = create<ChatStore>((set, get) => ({
  ...initialState,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setMessageSearchQuery: (query) => set({ messageSearchQuery: query }),
  setIsOnline: (online) => set({ isOnline: online }),
  setSocketStatus: (socketStatus) => set({ socketStatus }),
  reset: () => set({ ...initialState }),

  fetchConversations: async () => {
    set({ isLoadingConversations: true, conversationsError: null });
    try {
      const conversations = (await apiService.getConversations())
        .filter((c) => !!c.id)
        .sort(byRecency);

      set({ conversations, isLoadingConversations: false });

      // Auto-open the most recent thread on desktop only; on small screens the
      // list is the landing view and the user picks a thread themselves.
      const isWideViewport =
        typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;

      if (isWideViewport && conversations.length > 0 && !get().activeConversationId) {
        void get().setActiveConversation(conversations[0].id);
      }
    } catch (err) {
      set({ isLoadingConversations: false, conversationsError: apiError(err) });
    }
  },

  setActiveConversation: async (id: string) => {
    if (!id) return;

    set((state) => ({
      activeConversationId: id,
      messageSearchQuery: '',
      messagesError: null,
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, unreadCount: 0 } : c
      ),
    }));

    await get().fetchMessages(id);
  },

  clearActiveConversation: () => set({ activeConversationId: null, messageSearchQuery: '' }),

  fetchMessages: async (conversationId: string) => {
    if (!conversationId) return;

    // Only show the full-panel spinner on a first load; a refetch of an already
    // populated thread should not blank out the transcript.
    if (!get().messages[conversationId]) {
      set({ isLoadingMessages: true });
    }
    set({ messagesError: null });

    try {
      const msgList = await apiService.getMessages(conversationId);
      set((state) => ({
        messages: { ...state.messages, [conversationId]: msgList },
        isLoadingMessages: false,
      }));
    } catch (err) {
      set({ isLoadingMessages: false, messagesError: apiError(err) });
    }
  },

  sendMessage: async (conversationId: string, text: string, currentUser: User) => {
    const body = text.trim();
    if (!body || !conversationId) return;

    const clientTempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const optimisticMsg: Message = {
      id: clientTempId,
      conversationId,
      senderId: currentUser.id,
      sender: currentUser,
      text: body,
      createdAt: new Date().toISOString(),
      status: 'sending',
      clientTempId,
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] || []), optimisticMsg],
      },
    }));

    await get().retryMessage(conversationId, clientTempId, currentUser);
  },

  /**
   * Transmits (or re-transmits) a pending message. Sending is REST-only — the
   * gateway broadcasts to the other participants once `POST /messages` lands.
   */
  retryMessage: async (conversationId: string, clientTempId: string, currentUser: User) => {
    const pending = (get().messages[conversationId] || []).find(
      (m) => m.clientTempId === clientTempId
    );
    if (!pending) return;

    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((m) =>
          m.clientTempId === clientTempId ? { ...m, status: 'sending' as const } : m
        ),
      },
    }));

    try {
      const actualMsg = await apiService.sendMessage(conversationId, pending.text, clientTempId);

      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).map((m) =>
            m.clientTempId === clientTempId
              ? { ...actualMsg, sender: actualMsg.sender ?? currentUser, status: 'sent' as const }
              : m
          ),
        },
        conversations: state.conversations
          .map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage: actualMsg, updatedAt: actualMsg.createdAt }
              : c
          )
          .sort(byRecency),
      }));
    } catch (err) {
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).map((m) =>
            m.clientTempId === clientTempId
              ? { ...m, status: 'failed' as const, error: apiError(err) }
              : m
          ),
        },
      }));
    }
  },

  receiveSocketMessage: (msg: Message) => {
    if (!msg.conversationId) return;

    set((state) => {
      const currentMsgs = state.messages[msg.conversationId] || [];

      // The server does not echo a sender's own messages, but guard against
      // duplicates anyway in case a thread is refetched mid-flight.
      if (currentMsgs.some((m) => m.id === msg.id)) return state;

      const isActive = state.activeConversationId === msg.conversationId;

      return {
        ...state,
        messages: {
          ...state.messages,
          [msg.conversationId]: [...currentMsgs, msg],
        },
        conversations: state.conversations
          .map((c) =>
            c.id === msg.conversationId
              ? {
                  ...c,
                  lastMessage: msg,
                  updatedAt: msg.createdAt,
                  unreadCount: isActive ? 0 : (c.unreadCount || 0) + 1,
                }
              : c
          )
          .sort(byRecency),
      };
    });

    // A message for an unknown thread means the conversation list is stale
    // (e.g. somebody just added us to a group).
    if (!get().conversations.some((c) => c.id === msg.conversationId)) {
      void get().fetchConversations();
    }
  },

  upsertConversation: (conv: Conversation) => {
    if (!conv?.id) return;
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conv.id);
      return {
        conversations: (exists
          ? state.conversations.map((c) => (c.id === conv.id ? { ...c, ...conv } : c))
          : [conv, ...state.conversations]
        ).sort(byRecency),
      };
    });
  },

  startDirectConversation: async (userId: string) => {
    const conv = await apiService.startDirectConversation(userId);
    get().upsertConversation(conv);
    await get().setActiveConversation(conv.id);
    // The create response returns participants as bare ids, so refresh the list
    // to pick up the hydrated counterpart for the thread title.
    void get().fetchConversations();
    return conv.id;
  },

  createGroupConversation: async (name: string, participantIds: string[]) => {
    const conv = await apiService.createGroup(name, participantIds);
    get().upsertConversation(conv);
    await get().setActiveConversation(conv.id);
    return conv.id;
  },
}));
