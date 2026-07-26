import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useApp } from '../providers/AppProvider';
import colors from '../constants/colors';

const DESCRIPTION_BY_RESTAURANT: Record<string, string> = {
  'Demo Diner': 'Modern Indian · Bandra West',
  'Sunset Bistro': 'Coastal European · Marine Drive',
  'Urban Eats Cafe': 'All-day cafe · Powai',
};

const COLLAPSED_WIDTH = 48;
const EXPANDED_WIDTH = 148;
const ACTION_SIZE = 44;
const ACTIONS_ANIMATION_MS = 250;

type TopHeaderProps = {
  quickActionsExpanded: boolean;
  onQuickActionsExpandedChange: (expanded: boolean) => void;
};

export default function TopHeader({
  quickActionsExpanded,
  onQuickActionsExpandedChange,
}: TopHeaderProps) {
  const insets = useSafeAreaInsets();
  const { selectedRestaurant, bootstrap } = useApp();
  const expandedRef = useRef(quickActionsExpanded);
  const [reduceMotion, setReduceMotion] = useState(false);
  const width = useSharedValue(
    quickActionsExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
  );
  const iconProgress = useSharedValue(quickActionsExpanded ? 1 : 0);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    expandedRef.current = quickActionsExpanded;
    const duration = reduceMotion ? 120 : ACTIONS_ANIMATION_MS;
    const easing = Easing.out(Easing.cubic);

    if (quickActionsExpanded) {
      width.value = withTiming(EXPANDED_WIDTH, { duration, easing });
      iconProgress.value = withDelay(
        reduceMotion ? 0 : 55,
        withTiming(1, { duration: reduceMotion ? 100 : 160, easing }),
      );
    } else {
      iconProgress.value = withTiming(0, {
        duration: reduceMotion ? 80 : 120,
        easing,
      });
      width.value = withDelay(
        reduceMotion ? 0 : 28,
        withTiming(COLLAPSED_WIDTH, { duration: reduceMotion ? 100 : 205, easing }),
      );
    }
  }, [quickActionsExpanded, reduceMotion, iconProgress, width]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!expandedRef.current) return false;
      onQuickActionsExpandedChange(false);
      return true;
    });
    return () => subscription.remove();
  }, [onQuickActionsExpandedChange]);

  const name = selectedRestaurant?.name ?? 'Exzibo Manager';
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
  const desc = DESCRIPTION_BY_RESTAURANT[name] ?? (bootstrap?.user?.email ?? 'Restaurant workspace');
  const toggleQuickActions = useCallback(() => {
    const next = !expandedRef.current;
    expandedRef.current = next;
    onQuickActionsExpandedChange(next);
  }, [onQuickActionsExpandedChange]);

  const closeQuickActions = useCallback(() => {
    expandedRef.current = false;
    onQuickActionsExpandedChange(false);
  }, [onQuickActionsExpandedChange]);

  const handleShare = useCallback(async () => {
    closeQuickActions();
    await Share.share({
      message: `${name} — restaurant management workspace`,
    });
  }, [closeQuickActions, name]);

  const handleNotifications = useCallback(() => {
    closeQuickActions();
    router.push('/(app)/notification-settings');
  }, [closeQuickActions]);

  const actionsStyle = useAnimatedStyle(() => ({
    width: width.value,
    borderRadius: interpolate(width.value, [COLLAPSED_WIDTH, EXPANDED_WIDTH], [24, 999]),
  }));

  const secondaryActionsStyle = useAnimatedStyle(() => ({
    opacity: iconProgress.value,
    transform: [
      { translateX: interpolate(iconProgress.value, [0, 1], [8, 0]) },
      { scale: interpolate(iconProgress.value, [0, 1], [0.88, 1]) },
    ],
  }));

  return (
    <View style={[styles.outer, { paddingTop: insets.top }]} testID="top-header">
      <StatusBar style="light" />
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoInitial}>{initials || 'EM'}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.desc} numberOfLines={1}>{desc}</Text>
          </View>
        </View>

        <Animated.View style={[styles.actionsPill, actionsStyle]}>
          <Animated.View
            style={[styles.secondaryActions, secondaryActionsStyle]}
          >
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handleShare}
              disabled={!quickActionsExpanded}
              accessibilityRole="button"
              accessibilityLabel="Share"
              accessibilityState={{ disabled: !quickActionsExpanded }}
              testID="header-share"
              activeOpacity={0.7}
            >
            <Feather name="share" size={17} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handleNotifications}
              disabled={!quickActionsExpanded}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              accessibilityState={{ disabled: !quickActionsExpanded }}
              testID="header-notifications"
              activeOpacity={0.7}
            >
              <Feather name="bell" size={17} color={colors.foreground} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={quickActionsExpanded ? closeQuickActions : toggleQuickActions}
            accessibilityRole="button"
            accessibilityLabel={quickActionsExpanded ? 'Close quick actions' : 'Open quick actions'}
            accessibilityState={{ expanded: quickActionsExpanded }}
            testID="header-more"
            activeOpacity={0.7}
          >
            <Feather name="more-horizontal" size={17} color={colors.foreground} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { backgroundColor: colors.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  left: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#2B2C2D',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    borderWidth: 1, borderColor: colors.border,
  },
  logoInitial: { fontSize: 13, fontWeight: '800', color: colors.foreground, letterSpacing: 0.5 },
  name: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  desc: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  actionsPill: {
    height: 48,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    backgroundColor: '#1F2021', borderRadius: 999,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 2,
    overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8 } }),
  },
  secondaryActions: {
    position: 'absolute',
    left: 2,
    top: 2,
    height: ACTION_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: ACTION_SIZE,
    height: ACTION_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 10, width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.destructive,
  },
});
