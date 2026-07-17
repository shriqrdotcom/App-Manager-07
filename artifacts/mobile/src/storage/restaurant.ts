import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'exzibo-manager.selected_restaurant_id';

export async function getStoredRestaurantId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function storeRestaurantId(id: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, id);
}

export async function clearStoredRestaurantId(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // Ignore deletion errors
  }
}
