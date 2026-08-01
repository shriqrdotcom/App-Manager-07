/**
 * Manual mock for expo-secure-store.
 * Jest automatically uses this for any test that imports expo-secure-store.
 */
const store: Record<string, string> = {};

export const getItemAsync = jest.fn(
  async (key: string): Promise<string | null> => store[key] ?? null,
);

export const setItemAsync = jest.fn(async (key: string, value: string): Promise<void> => {
  store[key] = value;
});

export const deleteItemAsync = jest.fn(async (key: string): Promise<void> => {
  delete store[key];
});

/** Helper: reset the in-memory store between tests. */
export const __resetStore = () => {
  Object.keys(store).forEach((k) => delete store[k]);
};
