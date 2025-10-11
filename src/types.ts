export type Tokens = { accessToken: string | null; refreshToken: string | null };
export type Credentials = { email: string; password: string };

export type IAMConfig = {
  apiBaseUrl: string;
  loginPath?: string;    // default '/auth/login'
  refreshPath?: string;  // default '/auth/refresh'
  onLogout?: () => void; // optional callback
};