import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'exzibo_access_token';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

// On web, SecureStore is not available. Fallback to localStorage.
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

export type BookingStatus = 'pending' | 'confirmed' | 'arrived' | 'seated' | 'completed';
export type BookingType = 'table' | 'room';
export type BookingSource = 'phone' | 'walk-in' | 'whatsapp' | 'other';

export type Booking = {
  id: string;
  restaurant_id: string;
  guest_name: string;
  phone_code: string;
  phone: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  guests: number;
  booking_type: BookingType;
  seating_area: string;
  seat: string;
  status: BookingStatus;
  source: BookingSource;
  special_request?: string | null;
  staff_note?: string | null;
  created_at: string;
};

export type BookingCreate = {
  restaurant_id: string;
  guest_name: string;
  phone_code: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  booking_type: BookingType;
  seating_area: string;
  seat: string;
  status: 'pending' | 'confirmed';
  source: BookingSource;
  special_request?: string;
  staff_note?: string;
};

export const api = {
  setToken,
  getToken,
  clearToken,

  listBookings: (restaurantId: string, date?: string) => {
    const qs = new URLSearchParams({ restaurant_id: restaurantId });
    if (date) qs.set('date', date);
    return request<Booking[]>(`/api/bookings?${qs.toString()}`, {}, true);
  },
  createBooking: (payload: BookingCreate) =>
    request<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true),
};
