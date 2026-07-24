import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'exzibo_access_token';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

// On web, SecureStore is not available. Fallback to a simple in-memory / localStorage.
async function setToken(token: string) {
  if (Platform.OS === 'web') {
    try { window.localStorage.setItem(TOKEN_KEY, token); } catch {}
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

async function clearToken() {
  if (Platform.OS === 'web') {
    try { window.localStorage.removeItem(TOKEN_KEY); } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (auth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data.detail || data.message)) ||
      `Request failed with ${res.status}`;
    throw new Error(typeof message === 'string' ? message : 'Request failed');
  }
  return data as T;
}

export type UserPublic = { id: string; email: string; name: string };
export type Restaurant = { id: string; name: string; role: string };
export type Bootstrap = { user: UserPublic; restaurants: Restaurant[] };
export type AuthResponse = { access_token: string; token_type: string; user: UserPublic };

export const api = {
  setToken,
  getToken,
  clearToken,
  register: (email: string, password: string, name: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }, false),
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, false),
  bootstrap: () => request<Bootstrap>('/api/bootstrap', {}, true),
};
