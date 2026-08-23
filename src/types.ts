export type Tokens = { accessToken: string | null; refreshToken: string | null };
export type Credentials = { username?: string; email?: string; password: string };

export type IAMConfig = {
  apiBaseUrl: string;
  loginPath?: string;
  refreshPath?: string;
  logoutPath?: string;
  onLogout?: () => void;
};

export function identityFrom(credentials: Credentials): string {
  return (credentials.username || credentials.email || '').trim();
}

export function isAuthPath(url?: string): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/token') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout')
  );
}
