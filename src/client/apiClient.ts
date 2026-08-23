import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { isAuthPath } from '../types';

export function createApiClient(baseURL: string): AxiosInstance {
  const api = axios.create({ baseURL, timeout: 20000 });

  api.interceptors.request.use((config) => {
    if (!isAuthPath(config.url)) {
      const token = useAuthStore.getState().accessToken;
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  let refreshing = false;
  let queue: Array<(token: string | null) => void> = [];

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      if (
        error.response?.status === 401 &&
        original &&
        !original._retry &&
        !isAuthPath(original.url)
      ) {
        original._retry = true;
        const { refresh } = useAuthStore.getState();

        if (refreshing) {
          return new Promise((resolve) => {
            queue.push((token) => {
              if (token) original.headers['Authorization'] = `Bearer ${token}`;
              resolve(api(original));
            });
          });
        }

        refreshing = true;
        const newToken = await refresh();
        refreshing = false;
        queue.forEach((fn) => fn(newToken));
        queue = [];

        if (newToken) {
          original.headers['Authorization'] = `Bearer ${newToken}`;
          return api(original);
        }
      }
      return Promise.reject(error);
    },
  );

  return api;
}
