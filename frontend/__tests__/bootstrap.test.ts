/**
 * Tests for src/api/bootstrap.ts
 *
 * Covers:
 * - validateBootstrapResponse: accepts valid v1 responses
 * - validateBootstrapResponse: rejects wrong/missing apiVersion
 * - validateBootstrapResponse: rejects missing or malformed user
 * - validateBootstrapResponse: rejects missing or non-array restaurants
 * - validateBootstrapResponse: accepts all three valid mobile roles
 * - validateBootstrapResponse: rejects invalid roles
 * - validateBootstrapResponse: rejects invalid permissions
 * - fetchBootstrap: calls apiFetch with the correct path and validates
 */

// Mock the auth client so the better-auth ESM import chain is never resolved.
jest.mock('@/src/auth/client', () => ({
  authClient: { getCookie: jest.fn().mockResolvedValue(undefined) },
}));

// Mock apiFetch with an inline jest.fn() so fetchBootstrap tests can control it.
// jest.requireActual preserves ApiError for non-fetchBootstrap tests.
jest.mock('@/src/api/client', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const actual = jest.requireActual('@/src/api/client') as typeof import('@/src/api/client');
  return { ...actual, apiFetch: jest.fn() };
});

import {
  validateBootstrapResponse as parseBootstrapResponse,
  fetchBootstrap,
} from '@/src/api/bootstrap';
import { apiFetch } from '@/src/api/client';
import type { BootstrapResponse } from '@/src/types/bootstrap';

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

// ---- helpers ----

const authenticatedUserId = 'better-auth-user-1';
const validUser = { email: 'user@example.com', name: 'Alice', image: null };
const validateBootstrapResponse = (
  data: unknown,
  userId = authenticatedUserId,
) => parseBootstrapResponse(data, userId);

const validRestaurant = (role = 'owner') => ({
  uid: '1234567890',
  name: 'Demo Diner',
  role,
  permissions: ['manage_orders'],
});

const validPayload = (overrides: Record<string, unknown> = {}): unknown => ({
  apiVersion: 'v1',
  user: validUser,
  restaurants: [validRestaurant()],
  ...overrides,
});

// ---- apiVersion ----

describe('validateBootstrapResponse — apiVersion', () => {
  it('accepts apiVersion "v1"', () => {
    expect(() => validateBootstrapResponse(validPayload())).not.toThrow();
  });

  it('rejects wrong apiVersion', () => {
    expect(() => validateBootstrapResponse(validPayload({ apiVersion: 'v2' }))).toThrow(
      /Unsupported API version/i,
    );
  });

  it('rejects missing apiVersion', () => {
    const payload = { user: validUser, restaurants: [validRestaurant()] };
    expect(() => validateBootstrapResponse(payload)).toThrow();
  });

  it('rejects non-object input', () => {
    expect(() => validateBootstrapResponse(null)).toThrow();
    expect(() => validateBootstrapResponse('string')).toThrow();
    expect(() => validateBootstrapResponse(42)).toThrow();
  });
});

// ---- user ----

describe('validateBootstrapResponse — user', () => {
  it('accepts optional image field', () => {
    const result = validateBootstrapResponse(
      validPayload({ user: { ...validUser, image: 'https://example.com/avatar.png' } }),
    ) as BootstrapResponse;
    expect(result.user.image).toBe('https://example.com/avatar.png');
  });

  it('omits image field when empty string', () => {
    const result = validateBootstrapResponse(
      validPayload({ user: { ...validUser, image: '' } }),
    ) as BootstrapResponse;
    expect(result.user.image).toBeUndefined();
  });

  it('rejects missing user', () => {
    expect(() => validateBootstrapResponse(validPayload({ user: null }))).toThrow(
      /missing user/i,
    );
  });

  it('rejects when the authenticated session ID is missing', () => {
    expect(() => validateBootstrapResponse(validPayload(), '')).toThrow(
      /session missing user id/i,
    );
  });

  it('rejects user without email', () => {
    expect(() =>
      validateBootstrapResponse(validPayload({ user: { name: 'X' } })),
    ).toThrow(/missing email/i);
  });

  it('allows the nullable name returned by the backend', () => {
    const result = validateBootstrapResponse(
      validPayload({ user: { email: 'x@y.com', name: null, image: null } }),
    );
    expect(result.user.name).toBeNull();
  });
});

// ---- restaurants ----

describe('validateBootstrapResponse — restaurants', () => {
  it('accepts empty restaurant array', () => {
    const result = validateBootstrapResponse(
      validPayload({ restaurants: [] }),
    ) as BootstrapResponse;
    expect(result.restaurants).toHaveLength(0);
  });

  it('accepts multiple restaurants', () => {
    const result = validateBootstrapResponse(
      validPayload({
        restaurants: [validRestaurant('owner'), validRestaurant('staff')],
      }),
    ) as BootstrapResponse;
    expect(result.restaurants).toHaveLength(2);
  });

  it('rejects missing restaurants field', () => {
    const payload = { apiVersion: 'v1', user: validUser };
    expect(() => validateBootstrapResponse(payload)).toThrow(/missing restaurants/i);
  });

  it('rejects non-array restaurants', () => {
    expect(() => validateBootstrapResponse(validPayload({ restaurants: {} }))).toThrow(
      /missing restaurants/i,
    );
  });

  it('rejects restaurant without permanent uid', () => {
    const bad = { name: 'X', role: 'owner', permissions: [] };
    expect(() => validateBootstrapResponse(validPayload({ restaurants: [bad] }))).toThrow(
      /missing valid permanent uid/i,
    );
  });

  it('rejects an internal UUID or malformed restaurant uid', () => {
    for (const uid of ['r-12345678', '123456789', '12345678901']) {
      expect(() =>
        validateBootstrapResponse(
          validPayload({ restaurants: [{ ...validRestaurant(), uid }] }),
        ),
      ).toThrow(/missing valid permanent uid/i);
    }
  });

  it('preserves the permanent restaurant uid', () => {
    const result = validateBootstrapResponse(validPayload());
    expect(result.restaurants[0]?.uid).toBe('1234567890');
  });
});

// ---- roles ----

describe('validateBootstrapResponse — roles', () => {
  it.each(['owner', 'admin', 'staff'])('accepts role "%s"', (role) => {
    expect(() =>
      validateBootstrapResponse(validPayload({ restaurants: [validRestaurant(role)] })),
    ).not.toThrow();
  });

  it.each(['manager', 'superuser'])('rejects unsupported role "%s"', (role) => {
    expect(() =>
      validateBootstrapResponse(
        validPayload({ restaurants: [validRestaurant(role)] }),
      ),
    ).toThrow(/invalid role/i);
  });

  it('rejects empty role string', () => {
    expect(() =>
      validateBootstrapResponse(validPayload({ restaurants: [validRestaurant('')] })),
    ).toThrow(/invalid role/i);
  });

  it('rejects numeric role', () => {
    expect(() =>
      validateBootstrapResponse(
        validPayload({ restaurants: [{ ...validRestaurant(), role: 1 }] }),
      ),
    ).toThrow(/invalid role/i);
  });
});

// ---- permissions ----

describe('validateBootstrapResponse — permissions', () => {
  it('accepts empty permissions array', () => {
    const r = { ...validRestaurant(), permissions: [] };
    expect(() => validateBootstrapResponse(validPayload({ restaurants: [r] }))).not.toThrow();
  });

  it('rejects permissions with a non-string entry', () => {
    const r = { ...validRestaurant(), permissions: ['manage_orders', 42] };
    expect(() => validateBootstrapResponse(validPayload({ restaurants: [r] }))).toThrow(
      /invalid permissions/i,
    );
  });

  it('rejects non-array permissions', () => {
    const r = { ...validRestaurant(), permissions: 'manage_orders' };
    expect(() => validateBootstrapResponse(validPayload({ restaurants: [r] }))).toThrow(
      /invalid permissions/i,
    );
  });
});

// ---- fetchBootstrap integration ----

describe('fetchBootstrap', () => {
  beforeEach(() => mockApiFetch.mockReset());

  it('calls apiFetch with the bootstrap path', async () => {
    mockApiFetch.mockResolvedValueOnce(validPayload());
    await fetchBootstrap(authenticatedUserId);
    expect(mockApiFetch).toHaveBeenCalledWith('/api/mobile/v1/bootstrap');
  });

  it('validates and returns parsed bootstrap response', async () => {
    mockApiFetch.mockResolvedValueOnce(validPayload());
    const result = await fetchBootstrap(authenticatedUserId);
    expect(result.apiVersion).toBe('v1');
    expect(result.user.id).toBe(authenticatedUserId);
    expect(result.restaurants[0]?.uid).toBe('1234567890');
  });

  it('propagates ApiError from apiFetch', async () => {
    const { ApiError } = jest.requireActual('@/src/api/client') as typeof import('@/src/api/client');
    mockApiFetch.mockRejectedValueOnce(new ApiError('Network error', undefined, false, true));
    await expect(fetchBootstrap(authenticatedUserId)).rejects.toThrow('Network error');
  });

  it('throws on malformed bootstrap data from server', async () => {
    mockApiFetch.mockResolvedValueOnce({ apiVersion: 'v1', user: null, restaurants: [] });
    await expect(fetchBootstrap(authenticatedUserId)).rejects.toThrow(/missing user/i);
  });
});
