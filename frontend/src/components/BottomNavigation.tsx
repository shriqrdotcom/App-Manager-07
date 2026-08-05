import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../providers/ThemeProvider';

const ICON_SIZE = 20;

type Tab = {
  key: string;
  label: string;
  href: string;
  icon:
    | keyof typeof Feather.glyphMap
    | keyof typeof MaterialCommunityIcons.glyphMap;
  iconFamily: 'feather' | 'material-community';
};

const TABS: Tab[] = [
  { key: 'orders',    label: 'Orders',    href: '/(app)/orders',    icon: 'shopping-bag', iconFamily: 'feather' },
  { key: 'booking',   label: 'Booking',   href: '/(app)/booking',   icon: 'calendar-check', iconFamily: 'material-community' },
  { key: 'edit',      label: 'Edit',      href: '/(app)/edit',      icon: 'view-grid', iconFamily: 'material-community' },
  { key: 'analytics', label: 'Analytics', href: '/(app)/analytics', icon: 'chart-donut', iconFamily: 'material-community' },
  { key: 'settings',  label: 'Profile',   href: '/(app)/settings',  icon: 'account-circle', iconFamily: 'material-community' },
];

type Props = {
  /**
   * When provided (pager mode), this index drives the active indicator.
   * When omitted, falls back to matching the current pathname.
   */
  activeIndex?: number;
  /**
   * When provided (pager mode), pressing a tab calls this instead of
   * router.navigate so the pager animates and the Stack URL stays stable.
   */
  onTabPress?: (index: number) => void;
};

export default function BottomNavigation({ activeIndex, onTabPress }: Props) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Active colours derived from theme
  const ACTIVE_COLOR = colors.foreground;
  const ACTIVE_ICON_COLOR = colors.foreground;
  const INACTIVE_COLOR = colors.mutedForeground;

  function isActive(tab: Tab, index: number): boolean {
    if (activeIndex !== undefined) return index === activeIndex;
    return pathname?.endsWith(tab.href.split('/').pop() ?? '') ?? false;
  }

  function handlePress(tab: Tab, index: number) {
    if (onTabPress) {
      onTabPress(index);
    } else {
      router.navigate(tab.href as Parameters<typeof router.navigate>[0]);
    }
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 6),
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      ]}
      testID="bottom-nav"
    >
      <View style={styles.bar}>
        <View style={styles.tabs}>
          {TABS.map((tab, index) => {
            const active = isActive(tab, index);
            const color = active ? ACTIVE_ICON_COLOR : INACTIVE_COLOR;
            return (
              <TouchableOpacity
                key={tab.key}
                testID={`tab-${tab.key}`}
                onPress={() => handlePress(tab, index)}
                activeOpacity={0.78}
                style={[styles.tab, active && styles.activeTab]}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
              >
                {active && (
                  <>
                    <BlurView
                      intensity={isDark ? 38 : 28}
                      tint={isDark ? 'dark' : 'light'}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />
                    <LinearGradient
                      colors={isDark
                        ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.12)']
                        : ['rgba(255,255,255,0.78)', 'rgba(255,255,255,0.42)', 'rgba(255,255,255,0.62)']}
                      locations={[0, 0.54, 1]}
                      start={{ x: 0.08, y: 0 }}
                      end={{ x: 0.92, y: 1 }}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />
                  </>
                )}
                <View style={[styles.iconWrap, active && styles.activeIconWrap]}>
                  {tab.iconFamily === 'feather' ? (
                    <Feather name={tab.icon as keyof typeof Feather.glyphMap} size={ICON_SIZE} color={color} />
                  ) : (
                    <MaterialCommunityIcons
                      name={tab.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={ICON_SIZE}
                      color={color}
                    />
                  )}
                </View>
                <Text style={[styles.label, { color: active ? ACTIVE_COLOR : INACTIVE_COLOR }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-order')}
          activeOpacity={0.82}
          testID="bottom-nav-add"
          accessibilityRole="button"
          accessibilityLabel="Create manual order"
        >
          <BlurView
            intensity={isDark ? 42 : 30}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <LinearGradient
            colors={isDark
              ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.14)']
              : ['rgba(255,255,255,0.82)', 'rgba(255,255,255,0.44)', 'rgba(255,255,255,0.68)']}
            locations={[0, 0.55, 1]}
            start={{ x: 0.08, y: 0 }}
            end={{ x: 0.92, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Feather name="plus" size={22} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 5,
    paddingHorizontal: 10,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  activeTab: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  iconWrap: {
    minWidth: 40,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  activeIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  label: { fontSize: 9.5, fontWeight: '600' },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
});
