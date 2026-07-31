/**
 * Main tabs screen — the single Stack screen that hosts all five app tabs.
 *
 * All tab components are imported directly and rendered simultaneously in
 * SwipePager so they stay mounted across tab switches, preserving scroll
 * positions, loaded data, and avoiding duplicate API requests.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNavigation from '@/src/components/BottomNavigation';
import SwipePager from '@/src/components/SwipePager';
import TopHeader from '@/src/components/TopHeader';
import { useTheme, type ThemePalette } from '@/src/providers/ThemeProvider';
import { ScrollHeaderProvider, useScrollHeader } from '@/src/providers/ScrollHeaderProvider';
import AnalyticsScreen from './analytics';
import BookingScreen from './booking';
import EditScreen from './edit';
import OrdersScreen from './orders';
import SettingsScreen from './settings';

/** Height of the header row below the safe area (paddingTop + row + paddingBottom). */
const HEADER_ROW_HEIGHT = 64;

/**
 * Pages array is module-level so the React element references are stable
 * across renders — React reconciles them as the same elements and never
 * unmounts/remounts the tab screens.
 */
const PAGES = [
  <OrdersScreen key="orders" />,
  <BookingScreen key="booking" />,
  <EditScreen key="edit" />,
  <AnalyticsScreen key="analytics" />,
  <SettingsScreen key="settings" />,
];

function makeStyles(colors: ThemePalette, headerHeight: number) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerLayer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    quickActionsBackdrop: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 5,
    },
    screen: { flex: 1 },
  });
}

export default function TabsScreen() {
  return (
    <ScrollHeaderProvider>
      <TabsContent />
    </ScrollHeaderProvider>
  );
}

function TabsContent() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { syncToTab } = useScrollHeader();
  const headerHeight = insets.top + HEADER_ROW_HEIGHT;
  const styles = useMemo(() => makeStyles(colors, headerHeight), [colors, headerHeight]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(false);

  /** Sync header shadow to the newly-active tab's stored scroll position. */
  useEffect(() => {
    syncToTab(activeIndex);
  }, [activeIndex, syncToTab]);

  /** Called by SwipePager the moment a swipe is committed (before snap ends). */
  const handleCommit = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  /** Called by BottomNavigation when a tab icon is pressed. */
  const handleTabPress = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  return (
    <View style={styles.container}>
      {quickActionsExpanded && (
        <Pressable
          style={styles.quickActionsBackdrop}
          onPress={() => setQuickActionsExpanded(false)}
          accessibilityLabel="Close quick actions"
          accessibilityRole="button"
          testID="quick-actions-backdrop"
        />
      )}
      <View style={styles.headerLayer}>
        <TopHeader
          quickActionsExpanded={quickActionsExpanded}
          onQuickActionsExpandedChange={setQuickActionsExpanded}
        />
      </View>
      <View style={styles.screen}>
        <SwipePager
          pages={PAGES}
          activeIndex={activeIndex}
          onCommit={handleCommit}
        />
      </View>
      <BottomNavigation activeIndex={activeIndex} onTabPress={handleTabPress} />
    </View>
  );
}
