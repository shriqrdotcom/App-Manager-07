/**
 * Focused provider tests for the authenticated mobile access boundary.
 *
 * These tests verify that:
 * - restaurant selection is restricted to the server bootstrap allow-list
 * - a bootstrap from a previous account cannot update the current account
 * - logout clears the bootstrap and persisted restaurant selection
 */

import React from 'react';
import { authClient } from '@/src/auth/client';
import { fetchBootstrap } from '@/src/api/bootstrap';
import {
  clearStoredRestaurantId,
  getStoredRestaurantId,
  storeRestaurantId,
} from '@/src/storage/restaurant';
import { AppContext, type AppContextValue } from '@/src/providers/AppContext';
import { NormalAppProvider } from '@/src/providers/NormalAppProvider';

type ReactTestRenderer = {
  update: (component: React.ReactElement) => void;
};

// react-test-renderer is already installed through the Expo test preset, but
// this project intentionally does not add its separate type package.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { act, create } = require('react-test-renderer') as {
  act: (callback: () => void | Promise<void>) => Promise<void>;
  create: (component: React.ReactElement) => ReactTestRenderer;
};

jest.mock('@/src/auth/client', () => ({
  authClient: {
    useSession: jest.fn(),
    signOut: jest.fn(),
  },
}));

jest.mock('@/src/api/bootstrap', () => ({
  fetchBootstrap: jest.fn(),
}));

jest.mock('@/src/storage/restaurant', () => ({
  clearStoredRestaurantId: jest.fn(),
  getStoredRestaurantId: jest.fn(),
  storeRestaurantId: jest.fn(),
}));

const mockAuthClient = authClient as unknown as {
  useSession: jest.Mock;
  signOut: jest.Mock;
};
const mockFetchBootstrap = fetchBootstrap as jest.MockedFunction<typeof fetchBootstrap>;
const mockGetStoredRestaurantId = getStoredRestaurantId as jest.MockedFunction<
  typeof getStoredRestaurantId
>;
const mockStoreRestaurantId = storeRestaurantId as jest.MockedFunction<typeof storeRestaurantId>;
const mockClearStoredRestaurantId = clearStoredRestaurantId as jest.MockedFunction<
  typeof clearStoredRestaurantId
>;

const restaurant = (uid: string, role: 'owner' | 'admin' | 'staff' = 'staff') => ({
  uid,
  name: `Restaurant ${uid}`,
  role,
  permissions: [],
});

const bootstrap = (userId: string, restaurants = [restaurant('1111111111')]) => ({
  apiVersion: 'v1' as const,
  user: { id: userId, email: `${userId}@example.test`, name: userId },
  restaurants,
});

let latestContext: AppContextValue | undefined;

function ContextProbe() {
  latestContext = React.useContext(AppContext) ?? undefined;
  return null;
}

async function renderProvider(): Promise<ReactTestRenderer> {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(
      <NormalAppProvider>
        <ContextProbe />
      </NormalAppProvider>,
    );
  });
  return renderer;
}

beforeEach(() => {
  latestContext = undefined;
  mockAuthClient.useSession.mockReturnValue({
    data: { user: { id: 'user-a' } },
    isPending: false,
  });
  mockAuthClient.signOut.mockResolvedValue({});
  mockFetchBootstrap.mockReset();
  mockGetStoredRestaurantId.mockReset().mockResolvedValue(null);
  mockStoreRestaurantId.mockReset().mockResolvedValue(undefined);
  mockClearStoredRestaurantId.mockReset().mockResolvedValue(undefined);
});

describe('NormalAppProvider — authorization boundary', () => {
  it('only selects a restaurant returned by the authenticated bootstrap response', async () => {
    mockFetchBootstrap.mockResolvedValueOnce(
      bootstrap('user-a', [restaurant('1111111111'), restaurant('2222222222', 'admin')]),
    );

    await renderProvider();

    await act(async () => {
      await Promise.resolve();
    });
    expect(latestContext?.state).toBe('select-restaurant');

    await act(async () => {
      await latestContext?.selectRestaurant('9999999999');
    });
    expect(latestContext?.selectedRestaurant).toBeNull();

    await act(async () => {
      await latestContext?.selectRestaurant('2222222222');
    });
    expect(latestContext?.selectedRestaurant?.uid).toBe('2222222222');
    expect(mockStoreRestaurantId).toHaveBeenCalledWith('2222222222');
  });

  it('does not let a previous account resolve or persist after the session changes', async () => {
    let releaseUserAStorage!: (value: string | null) => void;
    const userAStorage = new Promise<string | null>((resolve) => {
      releaseUserAStorage = resolve;
    });

    mockFetchBootstrap.mockImplementation(async (userId) =>
      bootstrap(userId, [restaurant(userId === 'user-a' ? '1111111111' : '2222222222')]),
    );
    mockGetStoredRestaurantId
      .mockReturnValueOnce(userAStorage)
      .mockResolvedValue(null);

    const view = await renderProvider();
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockFetchBootstrap).toHaveBeenCalledWith('user-a');

    mockAuthClient.useSession.mockReturnValue({
      data: { user: { id: 'user-b' } },
      isPending: false,
    });
    await act(async () => {
      view.update(
        <NormalAppProvider>
          <ContextProbe />
        </NormalAppProvider>,
      );
      await Promise.resolve();
    });
    expect(latestContext?.selectedRestaurant?.uid).toBe('2222222222');

    await act(async () => {
      releaseUserAStorage(null);
      await userAStorage;
    });

    expect(latestContext?.selectedRestaurant?.uid).toBe('2222222222');
    expect(mockStoreRestaurantId).toHaveBeenCalledWith('2222222222');
    expect(mockStoreRestaurantId).not.toHaveBeenCalledWith('1111111111');
  });

  it('clears bootstrap and the persisted restaurant selection on logout', async () => {
    mockFetchBootstrap.mockResolvedValueOnce(bootstrap('user-a'));

    await renderProvider();
    await act(async () => {
      await Promise.resolve();
    });
    expect(latestContext?.state).toBe('home');

    await act(async () => {
      await latestContext?.logout();
    });

    expect(mockAuthClient.signOut).toHaveBeenCalledTimes(1);
    expect(mockClearStoredRestaurantId).toHaveBeenCalledTimes(1);
    expect(latestContext?.bootstrap).toBeNull();
    expect(latestContext?.selectedRestaurant).toBeNull();
  });
});