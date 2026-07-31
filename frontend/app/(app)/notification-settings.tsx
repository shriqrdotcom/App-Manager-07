import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';
import { storage } from '@/src/utils/storage';

// ─── Storage key ────────────────────────────────────────────────────────────
const STORAGE_KEY = 'notification_settings_v1';

// ─── Notification items ──────────────────────────────────────────────────────
const ITEMS: { key: string; label: string; desc: string; icon: keyof typeof Feather.glyphMap; color: string }[] = [
  { key: 'new_orders',        label: 'New orders',              desc: 'Alerts when a new order arrives',       icon: 'shopping-bag',  color: '#3B82F6' },
  { key: 'order_cancel',      label: 'Order cancellations',     desc: 'Alerts when an order is cancelled',     icon: 'x-circle',      color: '#EF4444' },
  { key: 'order_status',      label: 'Order status updates',    desc: 'Track order progress in real time',     icon: 'refresh-cw',    color: '#22C55E' },
  { key: 'new_bookings',      label: 'New bookings',            desc: 'Alerts when a reservation is made',     icon: 'calendar',      color: '#8B5CF6' },
  { key: 'booking_cancel',    label: 'Booking cancellations',   desc: 'Alerts when a booking is cancelled',    icon: 'calendar',      color: '#F59E0B' },
  { key: 'booking_reminders', label: 'Booking reminders',       desc: 'Reminders before upcoming bookings',    icon: 'clock',         color: '#06B6D4' },
  { key: 'stock_alerts',      label: 'Menu & stock alerts',     desc: 'Low stock and menu change updates',     icon: 'alert-triangle',color: '#F59E0B' },
  { key: 'payment_updates',   label: 'Payment updates',         desc: 'Payment confirmations and failures',    icon: 'credit-card',   color: '#22C55E' },
  { key: 'staff_updates',     label: 'Staff & account updates', desc: 'Staff changes and account activity',    icon: 'users',         color: '#EC4899' },
  { key: 'announcements',     label: 'System announcements',    desc: 'Platform updates and maintenance',      icon: 'info',          color: '#3B82F6' },
];

type Settings = {
  master: boolean;
  items: Record<string, boolean>;
};

const DEFAULT_SETTINGS: Settings = {
  master: true,
  items: Object.fromEntries(ITEMS.map((i) => [i.key, true])),
};

// ─── Animated toggle ──────────────────────────────────────────────────────────
function Toggle({
  value,
  onValueChange,
  disabled,
  label,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200 });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [disabled ? '#2E2E2E' : '#3A3A3A', '#7F9A82'],
    ),
    opacity: disabled ? 0.4 : 1,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 22 }],
    backgroundColor: disabled && !value ? '#888' : '#F5F5F5',
  }));

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      accessible
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      hitSlop={8}
      style={{ opacity: disabled && !value ? 0.38 : 1 }}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function NotificationSettings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const savedIndividual = useRef<Record<string, boolean>>(DEFAULT_SETTINGS.items);
  const [loaded, setLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      const saved = await storage.getItem(STORAGE_KEY, null);
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        const s = saved as Record<string, unknown>;
        const master = typeof s.master === 'boolean' ? s.master : true;
        const rawItems = (s.items && typeof s.items === 'object' && !Array.isArray(s.items))
          ? (s.items as Record<string, unknown>)
          : {};
        const items: Record<string, boolean> = Object.fromEntries(
          ITEMS.map((i) => [i.key, typeof rawItems[i.key] === 'boolean' ? rawItems[i.key] as boolean : true]),
        );
        savedIndividual.current = items;
        setSettings({ master, items });
      }
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback((next: Settings) => {
    storage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleMaster = useCallback((val: boolean) => {
    setSettings((prev) => {
      if (!val) {
        // turning off: save current individual state, then disable all
        savedIndividual.current = { ...prev.items };
        const next: Settings = {
          master: false,
          items: Object.fromEntries(ITEMS.map((i) => [i.key, false])),
        };
        persist(next);
        return next;
      } else {
        // turning on: restore individual state
        const next: Settings = {
          master: true,
          items: { ...savedIndividual.current },
        };
        persist(next);
        return next;
      }
    });
  }, [persist]);

  const toggleItem = useCallback((key: string, val: boolean) => {
    setSettings((prev) => {
      const items = { ...prev.items, [key]: val };
      savedIndividual.current = { ...savedIndividual.current, [key]: val };
      const next: Settings = { ...prev, items };
      persist(next);
      return next;
    });
  }, [persist]);

  if (!loaded) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications &amp; Quick Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Master toggle card */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.masterRow}>
              <View style={[styles.itemIcon, { backgroundColor: '#EF4444' }]}>
                <Feather name="bell" size={14} color="#fff" />
              </View>
              <View style={styles.masterLeft}>
                <Text style={[styles.masterLabel, { color: colors.foreground }]}>Allow Notifications</Text>
                <Text style={[styles.masterDesc, { color: colors.mutedForeground }]}>
                  {settings.master ? 'Notifications are enabled' : 'All notifications are paused'}
                </Text>
              </View>
              <Toggle
                value={settings.master}
                onValueChange={toggleMaster}
                label="Allow Notifications"
              />
            </View>
          </View>
        </View>

        {/* Individual toggles */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NOTIFICATION TYPES</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {ITEMS.map((item, i) => (
              <React.Fragment key={item.key}>
                <View
                  style={styles.itemRow}
                  accessible
                  accessibilityLabel={item.label}
                >
                  <View style={[styles.itemIcon, { backgroundColor: item.color, opacity: settings.master ? 1 : 0.38 }]}>
                    <Feather name={item.icon} size={14} color="#fff" />
                  </View>
                  <View style={styles.itemText}>
                    <Text style={[styles.itemLabel, { color: colors.foreground }, !settings.master && styles.dimText]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.itemDesc, { color: colors.mutedForeground }, !settings.master && styles.dimText]}>
                      {item.desc}
                    </Text>
                  </View>
                  <Toggle
                    value={settings.items[item.key]}
                    onValueChange={(v) => toggleItem(item.key, v)}
                    disabled={!settings.master}
                    label={item.label}
                  />
                </View>
                {i < ITEMS.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    flex: 1,
  },

  scroll: {
    paddingTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Master toggle row
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  masterLeft: { flex: 1 },
  masterLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  masterDesc: {
    fontSize: 12,
    marginTop: 2,
  },

  // Icon container
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Individual item rows
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  itemText: { flex: 1 },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
  dimText: {
    opacity: 0.45,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58, // 14px padding + 32px icon + 12px gap
  },

  // Toggle
  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F5F5F5',
  },
});
