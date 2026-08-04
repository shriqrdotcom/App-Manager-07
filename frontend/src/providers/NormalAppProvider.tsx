import React, {
  useCallback,
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
import { AppContext, type AppContextValue, type AppState } from './AppContext';

export function NormalAppProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<BootstrapRestaurant | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        await storeRestaurantId(only.uid);
        setSelectedRestaurant(only);
        return;
      }

      if (storedId) {
        const match = available.find((r) => r.uid === storedId);
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

  const loadBootstrap = useCallback(async (authenticatedUserId: string) => {
    setBootstrapLoading(true);
    setNetworkError(false);
    setErrorMessage(null);
    try {
      const bs = await fetchBootstrap(authenticatedUserId);
      setBootstrap(bs);
      await resolveRestaurant(bs);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.isAuthError) {
        // Session is invalid — sign out so auth flow restarts
        await authClient.signOut();
      } else {
        setNetworkError(true);
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to load your account. Please try again.',
        );
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
      void loadBootstrap(userId);
    } else if (!userId) {
      currentUserIdRef.current = undefined;
      setBootstrap(null);
      setSelectedRestaurant(null);
      setNetworkError(false);
      setErrorMessage(null);
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
      const restaurant = bootstrap.restaurants.find((r) => r.uid === id);
      if (!restaurant) return;
      await storeRestaurantId(restaurant.uid);
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
    setErrorMessage(null);
  }, []);

  const retryBootstrap = useCallback(() => {
    const userId = session?.user?.id;
    if (userId) void loadBootstrap(userId);
  }, [loadBootstrap, session?.user?.id]);

  const value = useMemo(
    (): AppContextValue => ({
      state,
      errorMessage,
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
      errorMessage,
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
