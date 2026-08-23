/// <reference path="../expo-secure-store.d.ts" />
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'rn_iam_access_token';
const REFRESH_KEY = 'rn_iam_refresh_token';
const useWebStore = typeof globalThis.localStorage !== 'undefined';

function webGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function webSet(key: string, value: string) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

function webRemove(key: string) {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // ignore
  }
}

export async function setTokens(accessToken: string | null, refreshToken: string | null) {
  if (useWebStore) {
    if (accessToken) webSet(ACCESS_KEY, accessToken);
    if (refreshToken) webSet(REFRESH_KEY, refreshToken);
    return;
  }
  if (accessToken) await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  if (useWebStore) return webGet(ACCESS_KEY);
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  if (useWebStore) return webGet(REFRESH_KEY);
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens() {
  if (useWebStore) {
    webRemove(ACCESS_KEY);
    webRemove(REFRESH_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
