import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { authClient } from '@/src/auth/client';
import { fetchBootstrap } from '@/src/api/bootstrap';
import { ApiError } from '@/src/api/client';
import {
  clearStoredRestaurantId,
  getStoredRestaurantId,
  storeRestaurantId,
} from '@/src/storage/restaurant';
import type { BootstrapResponse, BootstrapRestaurant } from '@/src/types/bootstrap';

export type AppState =
  | 'session-loading'
  | 'signed-out'
  | 'auth-in-progress'
  | 'bootstrap-loading'
  | 'no-restaurants'
  | 'select-restaurant'
  | 'home'
  | 'network-error';

interface AppContextValue {
  state: AppState;
  bootstrap: BootstrapResponse | null;
  selectedRestaurant: BootstrapRestaurant | null;
  selectRestaurant: (id: string) => Promise<void>;
  switchRestaurant: () => Promise<void>;
  logout: () => Promise<void>;
  retryBootstrap: () => void;
  setAuthInProgress: (value: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<BootstrapRestaurant | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);

  // Track current user to avoid stale bootstrap on re-renders
  const currentUserIdRef = useRef<string | undefined>(undefined);

  const resolveRestaurant = useCallback(
    async (bs: BootstrapResponse) => {
      const storedId = await getStoredRestaurantId();
      const available = bs.restaurants;

      if (available.length === 0) {
        setSelectedRestaurant(null);
        return;
      }

      if (available.length === 1) {
        const only = available[0]!;
        await storeRestaurantId(only.id);
        setSelectedRestaurant(only);
        return;
      }

      if (storedId) {
        const match = available.find((r) => r.id === storedId);
        if (match) {
          setSelectedRestaurant(match);
          return;
        }
        // Access was removed — clear stale selection
        await clearStoredRestaurantId();
      }

      // Multiple restaurants, none selected → show selection screen
      setSelectedRestaurant(null);
    },
    [],
  );

  const loadBootstrap = useCallback(async () => {
    setBootstrapLoading(true);
    setNetworkError(false);
    try {
      const bs = await fetchBootstrap();
      setBootstrap(bs);
      await resolveRestaurant(bs);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.isAuthError) {
        // Session is invalid — sign out so auth flow restarts
        await authClient.signOut();
      } else {
        setNetworkError(true);
      }
    } finally {
      setBootstrapLoading(false);
    }
  }, [resolveRestaurant]);

  // React to session changes
  useEffect(() => {
    if (sessionLoading) return;

    // Clear auth-in-progress when session resolves (success or cancel)
    setAuthInProgress(false);

    const userId = session?.user?.id;

    if (userId && userId !== currentUserIdRef.current) {
      currentUserIdRef.current = userId;
      void loadBootstrap();
    } else if (!userId) {
      currentUserIdRef.current = undefined;
      setBootstrap(null);
      setSelectedRestaurant(null);
      setNetworkError(false);
      setBootstrapLoading(false);
    }
  }, [sessionLoading, session?.user?.id, loadBootstrap]);

  const state: AppState = useMemo((): AppState => {
    if (sessionLoading) return 'session-loading';
    if (authInProgress) return 'auth-in-progress';
    if (!session?.user) return 'signed-out';
    if (networkError) return 'network-error';
    if (bootstrapLoading || !bootstrap) return 'bootstrap-loading';
    if (bootstrap.restaurants.length === 0) return 'no-restaurants';
    if (!selectedRestaurant) return 'select-restaurant';
    return 'home';
  }, [
    sessionLoading,
    authInProgress,
    session?.user,
    networkError,
    bootstrapLoading,
    bootstrap,
    selectedRestaurant,
  ]);

  const selectRestaurant = useCallback(
    async (id: string) => {
      if (!bootstrap) return;
      const restaurant = bootstrap.restaurants.find((r) => r.id === id);
      if (!restaurant) return;
      await storeRestaurantId(restaurant.id);
      setSelectedRestaurant(restaurant);
    },
    [bootstrap],
  );

  const switchRestaurant = useCallback(async () => {
    await clearStoredRestaurantId();
    setSelectedRestaurant(null);
  }, []);

  const logout = useCallback(async () => {
    await authClient.signOut();
    await clearStoredRestaurantId();
    setBootstrap(null);
    setSelectedRestaurant(null);
    setNetworkError(false);
  }, []);

  const retryBootstrap = useCallback(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  const value = useMemo(
    (): AppContextValue => ({
      state,
      bootstrap,
      selectedRestaurant,
      selectRestaurant,
      switchRestaurant,
      logout,
      retryBootstrap,
      setAuthInProgress,
    }),
    [
      state,
      bootstrap,
      selectedRestaurant,
      selectRestaurant,
      switchRestaurant,
      logout,
      retryBootstrap,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
