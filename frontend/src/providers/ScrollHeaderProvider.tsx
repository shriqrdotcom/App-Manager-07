import React, { createContext, useCallback, useContext, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

type ScrollHeaderContextType = {
  scrollY: SharedValue<number>;
  /** Called from UI thread via runOnJS — records per-tab scroll position */
  reportTabScroll: (tabIndex: number, y: number) => void;
  /** Called on tab switch to restore the newly-active tab's scroll position */
  syncToTab: (tabIndex: number) => void;
};

const ScrollHeaderContext = createContext<ScrollHeaderContextType | null>(null);

export function ScrollHeaderProvider({ children }: { children: React.ReactNode }) {
  const scrollY = useSharedValue(0);
  const tabPositions = useRef<number[]>([0, 0, 0, 0, 0]);

  const reportTabScroll = useCallback((tabIndex: number, y: number) => {
    tabPositions.current[tabIndex] = y;
  }, []);

  const syncToTab = useCallback(
    (tabIndex: number) => {
      scrollY.value = tabPositions.current[tabIndex] ?? 0;
    },
    [scrollY],
  );

  return (
    <ScrollHeaderContext.Provider value={{ scrollY, reportTabScroll, syncToTab }}>
      {children}
    </ScrollHeaderContext.Provider>
  );
}

export function useScrollHeader() {
  const ctx = useContext(ScrollHeaderContext);
  if (!ctx) throw new Error('useScrollHeader must be used within ScrollHeaderProvider');
  return ctx;
}
