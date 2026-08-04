/**
 * Tests for src/api/client.ts
 *
 * Covers:
 * - ApiError class construction and properties
 * - Network failures → isNetworkError = true
 * - HTTP 401 → isAuthError = true, status = 401
 * - HTTP 403 → isAuthError = false, status = 403
 * - Non-ok status codes → throws ApiError with correct status
 * - Empty response body → returns undefined
 * - Malformed JSON → throws ApiError (not a JSON SyntaxError)
 * - Successful JSON response → returns parsed value
 * - Cookie header is forwarded when auth client returns cookies
 * - Request URL is constructed from config.backendUrl + path
 */

import { ApiError, apiFetch } from '@/src/api/client';

// Mock auth client — we test the HTTP layer, not the auth layer.
jest.mock('@/src/auth/client', () => ({
  authClient: {
    getCookie: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock config to use a controlled URL.
jest.mock('@/src/config', () => ({
  config: { backendUrl: 'https://api.example.test' },
}));

const { authClient } = require('@/src/auth/client') as {
  authClient: { getCookie: jest.Mock };
};

const mockFetch = jest.fn() as jest.Mock;

beforeAll(() => {
  global.fetch = mockFetch;
});

beforeEach(() => {
  mockFetch.mockReset();
  authClient.getCookie.mockResolvedValue(undefined);
});

// ---------- ApiError class ----------

describe('ApiError', () => {
  it('has name "ApiError"', () => {
    const err = new ApiError('oops');
    expect(err.name).toBe('ApiError');
    expect(err instanceof Error).toBe(true);
    expect(err instanceof ApiError).toBe(true);
  });

  it('stores status, isAuthError and isNetworkError', () => {
    const err = new ApiError('msg', 401, true, false);
    expect(err.status).toBe(401);
    expect(err.isAuthError).toBe(true);
    expect(err.isNetworkError).toBe(false);
  });

  it('defaults isAuthError and isNetworkError to false', () => {
    const err = new ApiError('msg');
    expect(err.isAuthError).toBe(false);
    expect(err.isNetworkError).toBe(false);
    expect(err.status).toBeUndefined();
  });
});

// ---------- apiFetch ----------

describe('apiFetch — network error', () => {
  it('throws ApiError with isNetworkError=true when fetch rejects', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(apiFetch('/path')).rejects.toMatchObject({
      name: 'ApiError',
      isNetworkError: true,
      status: undefined,
    });
  });

  it('error message is user-friendly (no raw TypeError)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const request = apiFetch('/path');
    await expect(request).rejects.toThrow(/unable to reach/i);
  });
});

describe('apiFetch — 401 Unauthorized', () => {
  it('throws ApiError with isAuthError=true and status=401', async () => {
    mockFetch.mockResolvedValueOnce({ status: 401, ok: false });
    await expect(apiFetch('/protected')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      isAuthError: true,
    });
  });
});

describe('apiFetch — 403 Forbidden', () => {
  it('throws ApiError with status=403 and isAuthError=false', async () => {
    mockFetch.mockResolvedValueOnce({ status: 403, ok: false });
    await expect(apiFetch('/forbidden')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      isAuthError: false,
    });
  });

  it('maps a missing mobile membership to a safe access message', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 403,
      ok: false,
      text: async () =>
        JSON.stringify({
          code: 'FORBIDDEN',
          message: 'No active mobile membership found',
          error: 'No active mobile membership found',
        }),
    });

    await expect(apiFetch('/api/mobile/v1/bootstrap')).rejects.toThrow(
      'No active restaurant access was found for this Google account.',
    );
  });

  it('does not expose arbitrary server error details for forbidden requests', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 403,
      ok: false,
      text: async () =>
        JSON.stringify({
          code: 'FORBIDDEN',
          message: 'select * from private_table failed at database.internal',
        }),
    });

    await expect(apiFetch('/api/private')).rejects.toThrow(
      'You do not have permission to access this restaurant.',
    );
  });
});

describe('apiFetch — other non-ok responses', () => {
  it.each([500, 502, 503, 404])('throws ApiError with status=%i', async (status) => {
    mockFetch.mockResolvedValueOnce({ status, ok: false });
    await expect(apiFetch('/path')).rejects.toMatchObject({ name: 'ApiError', status });
  });
});

describe('apiFetch — success', () => {
  it('returns parsed JSON on ok response', async () => {
    const body = { id: 'r1', name: 'Demo Diner' };
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: async () => JSON.stringify(body),
    });
    const result = await apiFetch<typeof body>('/restaurants');
    expect(result).toEqual(body);
  });

  it('returns undefined for empty response body', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 204,
      ok: true,
      text: async () => '',
    });
    const result = await apiFetch<unknown>('/action');
    expect(result).toBeUndefined();
  });

  it('throws ApiError (not SyntaxError) for malformed JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: async () => 'not-json{{',
    });
    const request = apiFetch('/broken');
    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toThrow(/unexpected response/i);
  });
});

describe('apiFetch — URL construction', () => {
  it('appends path to backendUrl', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: async () => '{}',
    });
    await apiFetch('/api/mobile/v1/bootstrap');
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toBe('https://api.example.test/api/mobile/v1/bootstrap');
  });
});

describe('apiFetch — cookie forwarding', () => {
  it('includes Cookie header when auth client returns cookies', async () => {
    authClient.getCookie.mockResolvedValueOnce('session=abc123');
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: async () => '{}',
    });
    await apiFetch('/api/me');
    const requestOptions = mockFetch.mock.calls[0][1] as RequestInit;
    expect((requestOptions.headers as Record<string, string>)['Cookie']).toBe('session=abc123');
  });

  it('omits Cookie header when auth client returns no cookies', async () => {
    authClient.getCookie.mockResolvedValueOnce(undefined);
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      text: async () => '{}',
    });
    await apiFetch('/api/me');
    const requestOptions = mockFetch.mock.calls[0][1] as RequestInit;
    expect((requestOptions.headers as Record<string, string>)['Cookie']).toBeUndefined();
  });
});
