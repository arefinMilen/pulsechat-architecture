import axios from 'axios';
import { Conversation, Message, User } from '../types';
import {
  normalizeConversation,
  normalizeMessage,
  normalizeUser,
  sortMessagesAscending,
  unwrapList,
} from './normalize';

const API_BASE = 'https://frontend-task-chatapp.onrender.com/api';

export const TOKEN_STORAGE_KEY = 'pulsechat_token';
export const USER_STORAGE_KEY = 'pulsechat_user';

export const apiClient = axios.create({
  baseURL: API_BASE,
  // The API is hosted on a free Render instance that cold-starts. A short
  // timeout would abort a request the server is about to answer, so we wait it
  // out and surface progress in the UI instead.
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

/**
 * The search endpoint interpolates `q` straight into a MongoDB regular
 * expression, so an unescaped metacharacter crashes it with a 500. `+` is the
 * one that matters in practice — it begins most international phone numbers, so
 * typing a number into the search box takes the endpoint down without this.
 */
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * A minimum of three members — the creator plus two others — is enforced by the
 * API but not documented. Mirrored here so the constraint can be surfaced in the
 * UI before a request is made.
 */
export const MIN_GROUP_PARTICIPANTS = 2;

export const apiService = {
  async login(phone: string, name: string): Promise<{ token: string; user: User }> {
    const res = await apiClient.post('/auth/login', { phone, name });
    const data = res.data ?? {};

    if (!data.token) {
      throw new Error('The server did not return a session token.');
    }

    return {
      token: data.token,
      user: normalizeUser(data.user ?? data),
    };
  },

  async getMe(): Promise<User> {
    // Returns the user object directly rather than wrapping it in `{ user }`.
    const res = await apiClient.get('/auth/me');
    return normalizeUser(res.data);
  },

  async searchUsers(query: string): Promise<User[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // Matching is anchored to the start of the value, so a partial phone number
    // finds nothing. Alongside the escaped literal we also try a digits-only
    // form, which recovers numbers typed with a leading `+` or with spacing.
    const attempts = new Set<string>([escapeRegExp(trimmed)]);
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly && digitsOnly !== trimmed) attempts.add(digitsOnly);

    const pages = await Promise.all(
      [...attempts].map(async (q) => {
        try {
          const res = await apiClient.get(`/users/search?q=${encodeURIComponent(q)}`);
          return unwrapList(res.data, 'users').map(normalizeUser);
        } catch {
          // One variant failing should not lose the results of the other.
          return [] as User[];
        }
      })
    );

    const byId = new Map<string, User>();
    for (const user of pages.flat()) {
      if (user.id) byId.set(user.id, user);
    }
    return [...byId.values()];
  },

  async getConversations(): Promise<Conversation[]> {
    const res = await apiClient.get('/conversations');
    return unwrapList(res.data, 'conversations').map(normalizeConversation);
  },

  async startDirectConversation(userId: string): Promise<Conversation> {
    const res = await apiClient.post('/conversations', { userId });
    return normalizeConversation(res.data?.conversation ?? res.data);
  },

  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    const res = await apiClient.get(
      `/conversations/${conversationId}/messages?limit=${limit}`
    );
    // Messages arrive newest-first; the transcript renders oldest-first.
    return sortMessagesAscending(
      unwrapList(res.data, 'messages').map(normalizeMessage)
    );
  },

  async sendMessage(
    conversationId: string,
    text: string,
    clientTempId?: string
  ): Promise<Message> {
    const res = await apiClient.post('/messages', { conversationId, text, clientTempId });
    // `clientTempId` is not echoed back, so it is reattached for reconciliation.
    return { ...normalizeMessage(res.data), clientTempId };
  },

  async createGroup(name: string, participantIds: string[]): Promise<Conversation> {
    const res = await apiClient.post('/conversations/group', { name, participantIds });
    return normalizeConversation(res.data?.conversation ?? res.data);
  },

  async addParticipants(conversationId: string, userIds: string[]): Promise<Conversation> {
    const res = await apiClient.post(`/conversations/${conversationId}/participants`, {
      userIds,
    });
    return normalizeConversation(res.data);
  },

  // The group-mutation endpoints all return the updated conversation, so the
  // caller can patch state directly instead of refetching the whole list.
  async removeParticipant(conversationId: string, userId: string): Promise<Conversation> {
    const res = await apiClient.delete(
      `/conversations/${conversationId}/participants/${userId}`
    );
    return normalizeConversation(res.data);
  },

  async promoteAdmin(conversationId: string, userId: string): Promise<Conversation> {
    const res = await apiClient.post(`/conversations/${conversationId}/admins`, { userId });
    return normalizeConversation(res.data);
  },

  async renameGroup(conversationId: string, name: string): Promise<Conversation> {
    const res = await apiClient.patch(`/conversations/${conversationId}`, { name });
    return normalizeConversation(res.data);
  },
};
