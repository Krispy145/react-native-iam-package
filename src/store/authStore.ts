import { create } from 'zustand';
import type { Credentials, Tokens, IAMConfig } from '../types';
import { identityFrom } from '../types';
import {
  setTokens as ssSet,
  getAccessToken as ssGetAccess,
  getRefreshToken as ssGetRefresh,
  clearTokens as ssClear,
} from '../storage/secureStore';
import { createApiClient } from '../client/apiClient';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  apiBaseUrl: string;
  loginPath: string;
  refreshPath: string;
  logoutPath: string;
  onLogout?: () => void;
  api: ReturnType<typeof createApiClient> | null;

  configure: (cfg: IAMConfig) => void;
  restore: () => Promise<void>;
  setTokens: (t: Tokens) => Promise<void>;
  logout: () => Promise<void>;
  login: (c: Credentials) => Promise<boolean>;
  refresh: () => Promise<string | null>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  apiBaseUrl: '',
  loginPath: '/v1/auth/login',
  refreshPath: '/v1/auth/refresh',
  logoutPath: '/v1/auth/logout',
  onLogout: undefined,
  api: null,

  configure: (cfg: IAMConfig) => {
    set({
      apiBaseUrl: cfg.apiBaseUrl,
      loginPath: cfg.loginPath ?? '/v1/auth/login',
      refreshPath: cfg.refreshPath ?? '/v1/auth/refresh',
      logoutPath: cfg.logoutPath ?? '/v1/auth/logout',
      onLogout: cfg.onLogout,
      api: createApiClient(cfg.apiBaseUrl),
    });
  },

  restore: async () => {
    const accessToken = await ssGetAccess();
    const refreshToken = await ssGetRefresh();
    if (accessToken) {
      set({ accessToken, refreshToken });
      return;
    }
    if (refreshToken) {
      set({ refreshToken });
      await get().refresh();
    }
  },

  setTokens: async ({ accessToken, refreshToken }) => {
    set({ accessToken, refreshToken });
    await ssSet(accessToken, refreshToken);
  },

  logout: async () => {
    const rt = get().refreshToken || (await ssGetRefresh());
    const api = get().api ?? createApiClient(get().apiBaseUrl);
    if (rt) {
      try {
        await api.post(get().logoutPath, { refresh_token: rt });
      } catch {
        // still clear local session
      }
    }
    await ssClear();
    set({ accessToken: null, refreshToken: null });
    get().onLogout?.();
  },

  login: async (credentials) => {
    const identity = identityFrom(credentials);
    if (!identity) return false;
    try {
      const api = get().api ?? createApiClient(get().apiBaseUrl);
      const username = credentials.username?.trim();
      const { data } = await api.post(get().loginPath, {
        ...(username ? { username } : { email: identity }),
        password: credentials.password,
      });
      await get().setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
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
      await get().setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? rt,
      });
      return data.access_token as string;
    } catch {
      await ssClear();
      set({ accessToken: null, refreshToken: null });
      get().onLogout?.();
      return null;
    }
  },
}));
