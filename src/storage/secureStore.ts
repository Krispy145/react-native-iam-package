import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'rn_iam_access_token';
const REFRESH_KEY = 'rn_iam_refresh_token';

export async function setTokens(accessToken: string | null, refreshToken: string | null) {
  if (accessToken) await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}