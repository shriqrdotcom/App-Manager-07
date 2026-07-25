import { createContext } from 'react';
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

export interface AppContextValue {
  state: AppState;
  bootstrap: BootstrapResponse | null;
  selectedRestaurant: BootstrapRestaurant | null;
  selectRestaurant: (id: string) => Promise<void>;
  switchRestaurant: () => Promise<void>;
  logout: () => Promise<void>;
  retryBootstrap: () => void;
  setAuthInProgress: (value: boolean) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);
