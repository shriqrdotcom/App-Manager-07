import { apiFetch } from '@/api/client';
import type { MenuCategory, MenuItem } from '@/types/menu';

// ---------------------------------------------------------------------------
// Runtime validators — tolerate extra fields, reject structurally invalid rows
// ---------------------------------------------------------------------------

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isValidCategory(obj: unknown): obj is MenuCategory {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return isString(o['id']) && o['id'].length > 0 && isString(o['name']);
}

function isValidMenuItem(obj: unknown): obj is MenuItem {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    isString(o['id']) &&
    o['id'].length > 0 &&
    isString(o['name']) &&
    typeof o['price'] === 'number' &&
    isString(o['categoryId']) &&
    typeof o['isAvailable'] === 'boolean' &&
    typeof o['isPublished'] === 'boolean'
  );
}

/** Extract an array from common API envelope shapes: bare array, {categories}, {data} */
function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    for (const key of ['categories', 'items', 'data', 'results']) {
      if (Array.isArray(d[key])) return d[key] as unknown[];
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function fetchMenuCategories(
  restaurantId: string,
): Promise<MenuCategory[]> {
  const data = await apiFetch<unknown>(
    `/api/menu/categories/${encodeURIComponent(restaurantId)}`,
  );
  return extractArray(data).filter(isValidCategory);
}

export async function fetchMenuItems(
  restaurantId: string,
): Promise<MenuItem[]> {
  const data = await apiFetch<unknown>(
    `/api/menu/items/${encodeURIComponent(restaurantId)}`,
  );
  return extractArray(data).filter(isValidMenuItem);
}
