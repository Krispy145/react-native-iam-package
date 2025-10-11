import { create } from 'zustand';
import type { Credentials, Tokens, IAMConfig } from '../types';
import { setTokens as ssSet, getRefreshToken as ssGetRefresh, clearTokens as ssClear } from '../storage/secureStore';
import { createApiClient } from '../client/apiClient';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  apiBaseUrl: string;
  loginPath: string;
  refreshPath: string;
  onLogout?: () => void;
  api: ReturnType<typeof createApiClient> | null;

  configure: (cfg: IAMConfig) => void;
  setTokens: (t: Tokens) => Promise<void>;
  logout: () => Promise<void>;
  login: (c: Credentials) => Promise<boolean>;
  refresh: () => Promise<string | null>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  apiBaseUrl: '',
  loginPath: '/auth/login',
  refreshPath: '/auth/refresh',
  onLogout: undefined,
  api: null,

  configure: (cfg: IAMConfig) => {
    set({
      apiBaseUrl: cfg.apiBaseUrl,
      loginPath: cfg.loginPath ?? '/auth/login',
      refreshPath: cfg.refreshPath ?? '/auth/refresh',
      onLogout: cfg.onLogout,
      api: createApiClient(cfg.apiBaseUrl),
    });
  },

  setTokens: async ({ accessToken, refreshToken }) => {
    set({ accessToken, refreshToken });
    await ssSet(accessToken, refreshToken);
  },

  logout: async () => {
    await ssClear();
    set({ accessToken: null, refreshToken: null });
    get().onLogout?.();
  },

  login: async ({ email, password }) => {
    try {
      const api = get().api ?? createApiClient(get().apiBaseUrl);
      const { data } = await api.post(get().loginPath, { email, password });
      await get().setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token });
      return true;
    } catch {
      return false;
    }
  },

  refresh: async () => {
    try {
      const rt = (await ssGetRefresh()) || get().refreshToken;
      if (!rt) return null;
      const api = get().api ?? createApiClient(get().apiBaseUrl);
      const { data } = await api.post(get().refreshPath, { refresh_token: rt });
      await get().setTokens({ accessToken: data.access_token, refreshToken: data.refresh_token ?? rt });
      return data.access_token as string;
    } catch {
      await get().logout();
      return null;
    }
  },
}));