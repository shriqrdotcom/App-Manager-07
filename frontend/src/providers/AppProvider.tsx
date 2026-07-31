import React, { useContext, useMemo, type ReactNode } from 'react';
import { NormalAppProvider } from './NormalAppProvider';
import { AppContext, type AppContextValue } from './AppContext';
import type { BootstrapResponse } from '@/src/types/bootstrap';

export function AppProvider({ children }: { children: ReactNode }) {
  if (process.env.EXPO_PUBLIC_PREVIEW_DEMO === 'true') {
    return <DemoAppProvider>{children}</DemoAppProvider>;
  }
  return <NormalAppProvider>{children}</NormalAppProvider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

const DEMO_BOOTSTRAP: BootstrapResponse = {
  apiVersion: 'v1',
  user: {
    id: 'demo-user',
    email: 'demo@exzibo.com',
    name: 'Demo Manager',
  },
  restaurants: [
    {
      id: 'demo-restaurant',
      name: 'Demo Diner',
      role: 'manager',
      permissions: ['read:orders', 'read:bookings', 'read:menu', 'read:analytics', 'read:settings'],
    },
  ],
};

function DemoAppProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    (): AppContextValue => ({
      state: 'home',
      errorMessage: null,
      bootstrap: DEMO_BOOTSTRAP,
      selectedRestaurant: DEMO_BOOTSTRAP.restaurants[0]!,
      selectRestaurant: async () => {},
      switchRestaurant: async () => {},
      logout: async () => {},
      retryBootstrap: () => {},
      setAuthInProgress: () => {},
    }),
    [],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
