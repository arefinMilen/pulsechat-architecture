import { create } from 'zustand';
import { User } from '../types';
import { apiService } from '../lib/api-client';
import { initSocket, disconnectSocket } from '../lib/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (phone: string, name: string) => Promise<boolean>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (phone: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiService.login(phone, name);
      localStorage.setItem('pulsechat_token', data.token);
      localStorage.setItem('pulsechat_user', JSON.stringify(data.user));

      initSocket(data.token);

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Login failed. Please try again.',
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('pulsechat_token');
    localStorage.removeItem('pulsechat_user');
    disconnectSocket();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initializeAuth: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('pulsechat_token');
    const storedUser = localStorage.getItem('pulsechat_user');

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        initSocket(token);
        set({
          user: parsedUser,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('pulsechat_token');
        localStorage.removeItem('pulsechat_user');
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
