import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '@/src/utils/storage';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type ThemePalette = {
  background: string;
  foreground: string;
  card: string;
  border: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  primary: string;
  primaryForeground: string;
  info: string;
};

const STORAGE_KEY = 'theme_preference_v1';

export const themePalettes: Record<ResolvedTheme, ThemePalette> = {
  dark: {
    background: '#121313',
    foreground: '#F5F5F5',
    card: '#1B1C1C',
    border: '#26272A',
    muted: '#1F2021',
    mutedForeground: '#8A8A8E',
    accent: '#2B2C2D',
    primary: '#F5F5F5',
    primaryForeground: '#121313',
    info: '#3B82F6',
  },
  light: {
    background: '#F7F7F8',
    foreground: '#18181B',
    card: '#FFFFFF',
    border: '#E4E4E7',
    muted: '#F1F1F3',
    mutedForeground: '#71717A',
    accent: '#ECECF0',
    primary: '#18181B',
    primaryForeground: '#FFFFFF',
    info: '#2563EB',
  },
};

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  colors: ThemePalette;
  isReady: boolean;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('dark');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    void storage.getItem(STORAGE_KEY, null).then((saved) => {
      if (active && isThemePreference(saved)) {
        setPreference(saved);
      }
      if (active) setIsReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const setThemePreference = useCallback(async (nextPreference: ThemePreference) => {
    setPreference(nextPreference);
    await storage.setItem(STORAGE_KEY, nextPreference);
  }, []);

  const resolvedTheme: ResolvedTheme =
    preference === 'system'
      ? systemColorScheme === 'light'
        ? 'light'
        : 'dark'
      : preference;

  const value = useMemo(
    (): ThemeContextValue => ({
      preference,
      resolvedTheme,
      colors: themePalettes[resolvedTheme],
      isReady,
      setThemePreference,
    }),
    [isReady, preference, resolvedTheme, setThemePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}