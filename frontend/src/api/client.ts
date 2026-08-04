import { authClient } from '@/src/auth/client';
import { config } from '@/src/config';
import type { Booking, CreateBookingInput } from '@/src/types/booking';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly isAuthError: boolean = false,
    public readonly isNetworkError: boolean = false,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function safeForbiddenMessage(body: unknown): string {
  const serverMessage =
    isRecord(body) && typeof body.message === 'string' ? body.message : '';

  if (/no active mobile membership/i.test(serverMessage)) {
    return 'No active restaurant access was found for this Google account.';
  }

  return 'You do not have permission to access this restaurant.';
}

function safeHttpErrorMessage(status: number, body: unknown): string {
  if (status === 403) return safeForbiddenMessage(body);
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status === 503) return 'Service temporarily unavailable. Please try again later.';
  return `Request failed (${status}). Please try again.`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${config.backendUrl}${path}`;

  let cookies: string | undefined;
  try {
    cookies = await authClient.getCookie();
  } catch {
    // No stored cookies — proceed without them; server will treat as unauthenticated
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (cookies) {
    headers['Cookie'] = cookies;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: 'omit',
      headers,
    });
  } catch {
    throw new ApiError(
      'Unable to reach the server. Please check your connection.',
      undefined,
      false,
      true,
    );
  }

  if (response.status === 401) {
    throw new ApiError(
      'Your session is no longer valid. Please sign in again.',
      401,
      true,
    );
  }

  if (!response.ok) {
    let body: unknown;
    if (typeof response.text === 'function') {
      const text = await response.text();
      if (text) {
        try {
          body = JSON.parse(text) as unknown;
        } catch {
          // Keep the user-facing message generic for non-JSON error bodies.
        }
      }
    }
    throw new ApiError(
      safeHttpErrorMessage(response.status, body),
      response.status,
    );
  }

  const text = await response.text();
  if (!text) {
    return undefined as unknown as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('Received an unexpected response from the server.');
  }
}

// Preview-only demo bookings so the Booking screen renders data without a real backend endpoint.
const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'demo-bk-1',
    guest_name: 'Sarah Miller',
    guests: 4,
    phone_code: '+1',
    phone: '555-0123',
    date: new Date().toISOString().split('T')[0],
    time: '18:30',
    seat: 'Table 4',
    booking_type: 'table',
    status: 'confirmed',
    special_request: 'Birthday celebration, gluten-free dessert',
  },
  {
    id: 'demo-bk-2',
    guest_name: 'James & Anna',
    guests: 2,
    phone_code: '+1',
    phone: '555-0199',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    seat: 'Table 7',
    booking_type: 'table',
    status: 'pending',
  },
  {
    id: 'demo-bk-3',
    guest_name: 'Riverstone Group',
    guests: 12,
    phone_code: '+1',
    phone: '555-0147',
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    seat: 'Private Room A',
    booking_type: 'room',
    status: 'arrived',
  },
];

export const api = {
  /**
   * Booking list API is not defined in the original `feature/mobile-menu-read` branch.
   * In preview demo mode it returns sample bookings; otherwise it returns an empty list
   * so the screen can still render without inventing a real endpoint.
   */
  listBookings: async (_restaurantId: string, _date: string): Promise<Booking[]> => {
    if (process.env.EXPO_PUBLIC_PREVIEW_DEMO === 'true') {
      return DEMO_BOOKINGS;
    }
    return [];
  },

  /**
   * Booking creation API is not defined in the original `feature/mobile-menu-read` branch.
   * In preview demo mode it echoes the input with a generated ID; otherwise it throws
   * so the app does not invent a real endpoint.
   */
  createBooking: async (input: CreateBookingInput): Promise<Booking> => {
    if (process.env.EXPO_PUBLIC_PREVIEW_DEMO === 'true') {
      return {
        id: `demo-bk-${Date.now()}`,
        guest_name: input.guest_name,
        guests: input.guests,
        phone_code: input.phone_code,
        phone: input.phone,
        date: input.date,
        time: input.time,
        seat: input.seat,
        booking_type: input.booking_type,
        status: input.status,
        special_request: input.special_request,
      };
    }
    throw new ApiError('Booking creation endpoint is not available.');
  },
};

export type { Booking, CreateBookingInput } from '@/src/types/booking';
export { BookingStatus, BookingType, BookingSource } from '@/src/types/booking';
