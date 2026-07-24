import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../providers/AppProvider';
import colors from '../constants/colors';

const DESCRIPTION_BY_RESTAURANT: Record<string, string> = {
  'Demo Diner': 'Modern Indian · Bandra West',
  'Sunset Bistro': 'Coastal European · Marine Drive',
  'Urban Eats Cafe': 'All-day cafe · Powai',
};

export default function TopHeader() {
  const insets = useSafeAreaInsets();
  const { selectedRestaurant, bootstrap, switchRestaurant, logout } = useApp();

  const name = selectedRestaurant?.name ?? 'Exzibo Manager';
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
  const desc = DESCRIPTION_BY_RESTAURANT[name] ?? (bootstrap?.user?.email ?? 'Restaurant workspace');
  const hasMultiple = (bootstrap?.restaurants.length ?? 0) > 1;

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

        <View style={styles.actionsPill}>
          <TouchableOpacity style={styles.iconBtn} testID="header-share" activeOpacity={0.7}>
            <Feather name="share" size={17} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} testID="header-notifications" activeOpacity={0.7}>
            <Feather name="bell" size={17} color={colors.foreground} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={hasMultiple ? switchRestaurant : logout}
            testID="header-more"
            activeOpacity={0.7}
          >
            <Feather name="more-horizontal" size={17} color={colors.foreground} />
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1F2021', borderRadius: 999,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 4,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8 } }),
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  notifDot: {
    position: 'absolute', top: 8, right: 10, width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.destructive,
  },
});
