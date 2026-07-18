import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/providers/AppProvider';
import { useColors } from '@/hooks/useColors';
import type { RestaurantRole } from '@/types/bootstrap';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
};

/** Roles that may access the Menu screen */
const MENU_ROLES: RestaurantRole[] = ['owner', 'admin', 'manager'];

export default function Home() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bootstrap, selectedRestaurant, logout, switchRestaurant } = useApp();
  const hasMultipleRestaurants = (bootstrap?.restaurants.length ?? 0) > 1;

  const role = selectedRestaurant?.role;
  const canAccessMenu = role !== undefined && MENU_ROLES.includes(role);

  const handleLogout = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
  };

  const handleSwitch = async () => {
    await Haptics.selectionAsync();
    await switchRestaurant();
  };

  const handleMenuPress = async () => {
    await Haptics.selectionAsync();
    router.push('/(app)/menu');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
          <Feather name="grid" size={16} color="#fff" />
        </View>
        <Text style={[styles.appTitle, { color: colors.foreground }]}>
          Exzibo Manager
        </Text>
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          style={styles.logoutBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="log-out" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Restaurant card */}
      {selectedRestaurant && (
        <View
          style={[
            styles.restaurantCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.restaurantCardHeader}>
            <View
              style={[
                styles.roleTag,
                { backgroundColor: colors.primary + '1A' },
              ]}
            >
              <Text style={[styles.roleTagText, { color: colors.primary }]}>
                {ROLE_LABELS[selectedRestaurant.role] ?? selectedRestaurant.role}
              </Text>
            </View>
            {hasMultipleRestaurants && (
              <TouchableOpacity
                onPress={handleSwitch}
                activeOpacity={0.7}
                style={styles.switchBtn}
              >
                <Feather
                  name="repeat"
                  size={13}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[styles.switchText, { color: colors.mutedForeground }]}
                >
                  Switch
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.restaurantName, { color: colors.foreground }]}>
            {selectedRestaurant.name}
          </Text>
          {bootstrap?.user && (
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
              {bootstrap.user.email}
            </Text>
          )}
        </View>
      )}

      {/* Menu action — owner / admin / manager only */}
      {canAccessMenu && (
        <TouchableOpacity
          onPress={handleMenuPress}
          activeOpacity={0.75}
          style={[
            styles.actionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.actionIconWrap,
              { backgroundColor: colors.primary + '1A' },
            ]}
          >
            <Feather name="menu" size={20} color={colors.primary} />
          </View>
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>
              Menu
            </Text>
            <Text
              style={[styles.actionSub, { color: colors.mutedForeground }]}
            >
              Browse categories and items
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  logoutBtn: {
    padding: 4,
  },
  restaurantCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  restaurantCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  switchText: {
    fontSize: 13,
    fontWeight: '500',
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 13,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionSub: {
    fontSize: 13,
  },
});
