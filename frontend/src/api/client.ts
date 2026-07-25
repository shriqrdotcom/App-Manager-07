import { authClient } from '@/src/auth/client';
import { config } from '@/src/config';

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
    throw new ApiError(
      `Request failed (${response.status}). Please try again.`,
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
