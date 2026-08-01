/**
 * Tests for src/storage/restaurant.ts
 *
 * Covers:
 * - getStoredRestaurantId: returns stored value
 * - getStoredRestaurantId: returns null when nothing stored
 * - getStoredRestaurantId: returns null on SecureStore error (graceful)
 * - storeRestaurantId: persists a restaurant ID
 * - clearStoredRestaurantId: removes stored ID
 * - clearStoredRestaurantId: swallows deletion errors silently
 * - Storage key is 'exzibo-manager.selected_restaurant_id'
 */

// In-memory store shared between mock functions and reset helper.
const _store: Record<string, string> = {};

const mockGet = jest.fn(async (key: string): Promise<string | null> => _store[key] ?? null);
const mockSet = jest.fn(async (key: string, value: string): Promise<void> => { _store[key] = value; });
const mockDelete = jest.fn(async (key: string): Promise<void> => { delete _store[key]; });

jest.mock('expo-secure-store', () => ({
  getItemAsync: (...args: Parameters<typeof mockGet>) => mockGet(...args),
  setItemAsync: (...args: Parameters<typeof mockSet>) => mockSet(...args),
  deleteItemAsync: (...args: Parameters<typeof mockDelete>) => mockDelete(...args),
}));

import {
  getStoredRestaurantId,
  storeRestaurantId,
  clearStoredRestaurantId,
} from '@/src/storage/restaurant';

const STORAGE_KEY = 'exzibo-manager.selected_restaurant_id';

beforeEach(() => {
  // Clear the in-memory store and reset call history.
  Object.keys(_store).forEach((k) => delete _store[k]);
  jest.clearAllMocks();
});

describe('getStoredRestaurantId', () => {
  it('returns null when nothing is stored', async () => {
    const id = await getStoredRestaurantId();
    expect(id).toBeNull();
    expect(mockGet).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('returns the stored restaurant ID', async () => {
    await storeRestaurantId('restaurant-abc');
    const id = await getStoredRestaurantId();
    expect(id).toBe('restaurant-abc');
  });

  it('returns null when SecureStore.getItemAsync throws', async () => {
    mockGet.mockRejectedValueOnce(new Error('SecureStore unavailable'));
    const id = await getStoredRestaurantId();
    expect(id).toBeNull();
  });
});

describe('storeRestaurantId', () => {
  it('persists the restaurant ID under the correct key', async () => {
    await storeRestaurantId('r-xyz');
    expect(mockSet).toHaveBeenCalledWith(STORAGE_KEY, 'r-xyz');
    expect(await getStoredRestaurantId()).toBe('r-xyz');
  });

  it('overwrites a previously stored ID', async () => {
    await storeRestaurantId('r-old');
    await storeRestaurantId('r-new');
    expect(await getStoredRestaurantId()).toBe('r-new');
  });
});

describe('clearStoredRestaurantId', () => {
  it('removes a stored restaurant ID', async () => {
    await storeRestaurantId('r-to-delete');
    await clearStoredRestaurantId();
    expect(mockDelete).toHaveBeenCalledWith(STORAGE_KEY);
    expect(await getStoredRestaurantId()).toBeNull();
  });

  it('does not throw when the key does not exist', async () => {
    await expect(clearStoredRestaurantId()).resolves.not.toThrow();
  });

  it('swallows deletion errors silently', async () => {
    mockDelete.mockRejectedValueOnce(new Error('delete failed'));
    await expect(clearStoredRestaurantId()).resolves.not.toThrow();
  });
});
