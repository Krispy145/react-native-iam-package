import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = !!accessToken;
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const configure = useAuthStore((s) => s.configure);
  const api = useAuthStore((s) => s.api);

  return { accessToken, isAuthenticated, login, logout, configure, api };
}