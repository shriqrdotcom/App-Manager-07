import { apiFetch } from '@/src/api/client';
import type {
  BootstrapResponse,
  BootstrapRestaurant,
  BootstrapUser,
  RestaurantRole,
} from '@/src/types/bootstrap';

const VALID_ROLES: RestaurantRole[] = ['owner', 'admin', 'staff'];

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

function isValidRole(value: unknown): value is RestaurantRole {
  return isString(value) && (VALID_ROLES as string[]).includes(value);
}

function isPermanentRestaurantUid(value: unknown): value is string {
  return isString(value) && /^\d{10}$/.test(value);
}

function parseUser(raw: unknown, authenticatedUserId: string): BootstrapUser {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Bootstrap response missing user object');
  }
  const u = raw as Record<string, unknown>;
  // The backend deliberately omits the user ID from this DTO. Identity must
  // come from the verified Better Auth session, never from response data.
  if (!isNonEmptyString(authenticatedUserId)) {
    throw new Error('Authenticated session missing user id');
  }
  if (!isNonEmptyString(u['email'])) throw new Error('Bootstrap user missing email');
  if (u['name'] !== null && !isString(u['name'])) {
    throw new Error('Bootstrap user has invalid name');
  }
  return {
    id: authenticatedUserId,
    email: u['email'],
    name: u['name'] as string | null,
    image: isNonEmptyString(u['image']) ? u['image'] : undefined,
  };
}

function parseRestaurant(raw: unknown, index: number): BootstrapRestaurant {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Restaurant at index ${index} is not an object`);
  }
  const r = raw as Record<string, unknown>;
  if (!isPermanentRestaurantUid(r['uid'])) {
    throw new Error(`Restaurant ${index} missing valid permanent uid`);
  }
  if (!isString(r['name'])) throw new Error(`Restaurant ${index} missing name`);
  if (!isValidRole(r['role'])) {
    throw new Error(`Restaurant ${index} has invalid role: ${String(r['role'])}`);
  }
  if (
    !Array.isArray(r['permissions']) ||
    !r['permissions'].every(isString)
  ) {
    throw new Error(`Restaurant ${index} has invalid permissions`);
  }
  return {
    uid: r['uid'],
    name: r['name'] as string,
    role: r['role'],
    permissions: r['permissions'] as string[],
  };
}

export function validateBootstrapResponse(
  data: unknown,
  authenticatedUserId: string,
): BootstrapResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Bootstrap response is not an object');
  }
  const obj = data as Record<string, unknown>;

  if (obj['apiVersion'] !== 'v1') {
    throw new Error(
      `Unsupported API version: ${String(obj['apiVersion'])}. Expected "v1".`,
    );
  }

  const user = parseUser(obj['user'], authenticatedUserId);

  if (!Array.isArray(obj['restaurants'])) {
    throw new Error('Bootstrap response missing restaurants array');
  }

  const restaurants = obj['restaurants'].map(parseRestaurant);

  return { apiVersion: 'v1', user, restaurants };
}

export async function fetchBootstrap(authenticatedUserId: string): Promise<BootstrapResponse> {
  const data = await apiFetch<unknown>('/api/mobile/v1/bootstrap');
  return validateBootstrapResponse(data, authenticatedUserId);
}
