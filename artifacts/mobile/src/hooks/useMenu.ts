import { useState, useCallback, useEffect } from 'react';
import { fetchMenuCategories, fetchMenuItems } from '@/api/menu';
import { ApiError } from '@/api/client';
import type { MenuCategory, MenuItem } from '@/types/menu';

export type MenuLoadState =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error-auth'
  | 'error-permission'
  | 'error-network'
  | 'error-server';

interface MenuState {
  categories: MenuCategory[];
  items: MenuItem[];
  loadState: MenuLoadState;
  errorMessage: string | null;
}

const INITIAL: MenuState = {
  categories: [],
  items: [],
  loadState: 'idle',
  errorMessage: null,
};

export function useMenu(restaurantId: string | null) {
  const [state, setState] = useState<MenuState>(INITIAL);

  const load = useCallback(async () => {
    if (!restaurantId) return;

    setState((s) => ({ ...s, loadState: 'loading', errorMessage: null }));

    try {
      const [categories, items] = await Promise.all([
        fetchMenuCategories(restaurantId),
        fetchMenuItems(restaurantId),
      ]);
      setState({ categories, items, loadState: 'success', errorMessage: null });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.isAuthError) {
          setState((s) => ({
            ...s,
            loadState: 'error-auth',
            errorMessage: err.message,
          }));
        } else if (err.status === 403) {
          setState((s) => ({
            ...s,
            loadState: 'error-permission',
            errorMessage: 'You do not have permission to view this menu.',
          }));
        } else if (err.isNetworkError) {
          setState((s) => ({
            ...s,
            loadState: 'error-network',
            errorMessage: err.message,
          }));
        } else {
          setState((s) => ({
            ...s,
            loadState: 'error-server',
            errorMessage: err.message,
          }));
        }
      } else {
        setState((s) => ({
          ...s,
          loadState: 'error-server',
          errorMessage: 'An unexpected error occurred.',
        }));
      }
    }
  }, [restaurantId]);

  // Auto-load on mount / when restaurantId changes
  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, load };
}
