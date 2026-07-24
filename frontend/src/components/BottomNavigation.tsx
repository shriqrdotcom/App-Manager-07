import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { usePathname, router } from 'expo-router';
import colors from '../constants/colors';

const ACTIVE_BG = '#26272A';
const ACTIVE_COLOR = '#F5F5F5';
const INACTIVE_COLOR = '#7A7A7E';
const ICON_SIZE = 20;

type Tab = { key: string; label: string; href: string; icon: keyof typeof Feather.glyphMap };

const TABS: Tab[] = [
  { key: 'orders',    label: 'Orders',    href: '/(app)/orders',    icon: 'shopping-bag' },
  { key: 'booking',   label: 'Booking',   href: '/(app)/booking',   icon: 'calendar' },
  { key: 'edit',      label: 'Edit',      href: '/(app)/edit',      icon: 'grid' },
  { key: 'analytics', label: 'Analytics', href: '/(app)/analytics', icon: 'bar-chart-2' },
  { key: 'settings',  label: 'Settings',  href: '/(app)/settings',  icon: 'sliders' },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]} testID="bottom-nav">
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const active = pathname?.endsWith(tab.href.split('/').pop() || '') ?? false;
          const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
          return (
            <TouchableOpacity
              key={tab.key}
              testID={`tab-${tab.key}`}
              onPress={() => router.navigate(tab.href as any)}
              activeOpacity={0.75}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
            >
              <View style={[styles.iconWrap, active && { backgroundColor: ACTIVE_BG }]}>
                <Feather name={tab.icon} size={ICON_SIZE} color={color} />
              </View>
              <Text style={[styles.label, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bar: { flexDirection: 'row', paddingTop: 8, paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 4 },
  iconWrap: {
    minWidth: 56, height: 30, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14,
  },
  label: { fontSize: 10.5, fontWeight: '600' },
});
