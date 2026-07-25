import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, Bootstrap, Restaurant } from '../api/client';

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

  // On startup: no active backend — always start at sign-in
  useEffect(() => {
    (async () => {
      // Clear any previously stored token from the old backend
      await api.clearToken();
      setState('signed-out');
    })();
  }, []);

  // login and register are stubs — authentication backend not yet connected
  const login = useCallback(async (_email: string, _password: string) => {
    throw new Error('Authentication backend not yet configured.');
  }, []);

  const register = useCallback(async (_email: string, _password: string, _name: string) => {
    throw new Error('Authentication backend not yet configured.');
  }, []);

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

  const retryBootstrap = useCallback(async () => {
    setState('signed-out');
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
    retryBootstrap,
    setAuthInProgress,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
