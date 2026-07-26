/**
 * Main tabs screen — the single Stack screen that hosts all five app tabs.
 *
 * All tab components are imported directly and rendered simultaneously in
 * SwipePager so they stay mounted across tab switches, preserving scroll
 * positions, loaded data, and avoiding duplicate API requests.
 */
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import BottomNavigation from '@/src/components/BottomNavigation';
import SwipePager from '@/src/components/SwipePager';
import TopHeader from '@/src/components/TopHeader';
import colors from '@/src/constants/colors';

// Import tab screens as plain React components.
// They remain mounted for the lifetime of this screen.
import AnalyticsScreen from './analytics';
import BookingScreen from './booking';
import EditScreen from './edit';
import OrdersScreen from './orders';
import SettingsScreen from './settings';

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

export default function TabsScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(false);

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerLayer: { zIndex: 2 },
  quickActionsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  screen: { flex: 1 },
});
