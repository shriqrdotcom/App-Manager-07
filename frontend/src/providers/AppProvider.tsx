import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, Bootstrap, Restaurant, UserPublic } from '../api/client';

type AppState =
  | 'session-loading'
  | 'signed-out'
  | 'auth-in-progress'
  | 'bootstrap-loading'
  | 'network-error'
  | 'no-restaurants'
  | 'select-restaurant'
  | 'home';

type AppContextValue = {
  state: AppState;
  bootstrap: Bootstrap | null;
  selectedRestaurant: Restaurant | null;
  errorMessage: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  selectRestaurant: (id: string) => Promise<void>;
  switchRestaurant: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
  setAuthInProgress: (v: boolean) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>('session-loading');
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const doBootstrap = useCallback(async () => {
    setState('bootstrap-loading');
    setErrorMessage(null);
    try {
      const data = await api.bootstrap();
      setBootstrap(data);
      if (data.restaurants.length === 0) {
        setState('no-restaurants');
      } else if (data.restaurants.length === 1) {
        setSelectedRestaurant(data.restaurants[0]);
        setState('home');
      } else {
        setSelectedRestaurant(null);
        setState('select-restaurant');
      }
    } catch (e: any) {
      // Token invalid → treat as signed-out. Otherwise network error.
      const msg = e?.message ?? 'Network error';
      if (/401|invalid|expired|missing/i.test(msg)) {
        await api.clearToken();
        setState('signed-out');
      } else {
        setErrorMessage(msg);
        setState('network-error');
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await api.getToken();
      if (!token) {
        setState('signed-out');
        return;
      }
      await doBootstrap();
    })();
  }, [doBootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    setState('auth-in-progress');
    setErrorMessage(null);
    try {
      const res = await api.login(email, password);
      await api.setToken(res.access_token);
      await doBootstrap();
    } catch (e: any) {
      setErrorMessage(e?.message ?? 'Sign in failed');
      setState('signed-out');
      throw e;
    }
  }, [doBootstrap]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setState('auth-in-progress');
    setErrorMessage(null);
    try {
      const res = await api.register(email, password, name);
      await api.setToken(res.access_token);
      await doBootstrap();
    } catch (e: any) {
      setErrorMessage(e?.message ?? 'Sign up failed');
      setState('signed-out');
      throw e;
    }
  }, [doBootstrap]);

  const logout = useCallback(async () => {
    await api.clearToken();
    setBootstrap(null);
    setSelectedRestaurant(null);
    setState('signed-out');
  }, []);

  const selectRestaurant = useCallback(async (id: string) => {
    const r = bootstrap?.restaurants.find((x) => x.id === id);
    if (r) {
      setSelectedRestaurant(r);
      setState('home');
    }
  }, [bootstrap]);

  const switchRestaurant = useCallback(async () => {
    setSelectedRestaurant(null);
    setState('select-restaurant');
  }, []);

  const setAuthInProgress = useCallback((v: boolean) => {
    setState(v ? 'auth-in-progress' : 'signed-out');
  }, []);

  const value: AppContextValue = {
    state,
    bootstrap,
    selectedRestaurant,
    errorMessage,
    login,
    register,
    logout,
    selectRestaurant,
    switchRestaurant,
    retryBootstrap: doBootstrap,
    setAuthInProgress,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
