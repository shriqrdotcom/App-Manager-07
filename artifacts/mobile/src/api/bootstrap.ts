import { apiFetch } from './client';
import type {
  BootstrapResponse,
  BootstrapRestaurant,
  BootstrapUser,
  RestaurantRole,
} from '@/types/bootstrap';

const VALID_ROLES: RestaurantRole[] = ['owner', 'admin', 'manager', 'staff'];

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

function isValidRole(value: unknown): value is RestaurantRole {
  return isString(value) && (VALID_ROLES as string[]).includes(value);
}

function parseUser(raw: unknown): BootstrapUser {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Bootstrap response missing user object');
  }
  const u = raw as Record<string, unknown>;
  if (!isNonEmptyString(u['id'])) throw new Error('Bootstrap user missing id');
  if (!isNonEmptyString(u['email'])) throw new Error('Bootstrap user missing email');
  if (!isString(u['name'])) throw new Error('Bootstrap user missing name');
  return {
    id: u['id'],
    email: u['email'],
    name: u['name'] as string,
    image: isNonEmptyString(u['image']) ? u['image'] : undefined,
  };
}

function parseRestaurant(raw: unknown, index: number): BootstrapRestaurant {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Restaurant at index ${index} is not an object`);
  }
  const r = raw as Record<string, unknown>;
  if (!isNonEmptyString(r['id'])) throw new Error(`Restaurant ${index} missing id`);
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
    id: r['id'],
    name: r['name'] as string,
    role: r['role'],
    permissions: r['permissions'] as string[],
  };
}

export function validateBootstrapResponse(data: unknown): BootstrapResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Bootstrap response is not an object');
  }
  const obj = data as Record<string, unknown>;

  if (obj['apiVersion'] !== 'v1') {
    throw new Error(
      `Unsupported API version: ${String(obj['apiVersion'])}. Expected "v1".`,
    );
  }

  const user = parseUser(obj['user']);

  if (!Array.isArray(obj['restaurants'])) {
    throw new Error('Bootstrap response missing restaurants array');
  }

  const restaurants = obj['restaurants'].map(parseRestaurant);

  return { apiVersion: 'v1', user, restaurants };
}

export async function fetchBootstrap(): Promise<BootstrapResponse> {
  const data = await apiFetch<unknown>('/api/mobile/v1/bootstrap');
  return validateBootstrapResponse(data);
}
