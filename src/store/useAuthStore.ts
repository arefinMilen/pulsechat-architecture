import { create } from 'zustand';
import { User } from '../types';
import { apiService, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../lib/api-client';
import { apiError } from '../lib/normalize';
import { disconnectSocket, initSocket } from '../lib/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True until the persisted session has been read back from storage. */
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  login: (phone: string, name: string) => Promise<boolean>;
  logout: () => void;
  initializeAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitializing: true,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (phone: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await apiService.login(phone, name);

      if (!user.id) {
        throw new Error('The server returned an account without an identifier.');
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      initSocket(token);

      set({
        user,
        token,
        isAuthenticated: true,
        isInitializing: false,
        isLoading: false,
      });
      return true;
    } catch (err) {
      set({ error: apiError(err), isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    disconnectSocket();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: false,
      isLoading: false,
      error: null,
    });
  },

  initializeAuth: () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!token || !storedUser) {
      set({ isInitializing: false, isAuthenticated: false });
      return;
    }

    try {
      const user: User = JSON.parse(storedUser);

      // A session persisted before the id normalization landed is unusable.
      if (!user?.id) throw new Error('Stale session payload');

      initSocket(token);
      set({ user, token, isAuthenticated: true, isInitializing: false });
    } catch {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      set({ isInitializing: false, isAuthenticated: false });
    }
  },
}));
