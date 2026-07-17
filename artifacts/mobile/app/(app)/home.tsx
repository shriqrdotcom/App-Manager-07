import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/providers/AppProvider';
import { useColors } from '@/hooks/useColors';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
};

export default function Home() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bootstrap, selectedRestaurant, logout, switchRestaurant } = useApp();
  const hasMultipleRestaurants = (bootstrap?.restaurants.length ?? 0) > 1;

  const handleLogout = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await logout();
  };

  const handleSwitch = async () => {
    await Haptics.selectionAsync();
    await switchRestaurant();
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

      {/* Coming soon placeholder */}
      <View
        style={[
          styles.comingSoonCard,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <Feather name="clock" size={22} color={colors.mutedForeground} />
        <View style={styles.comingSoonText}>
          <Text style={[styles.comingSoonTitle, { color: colors.foreground }]}>
            Menu management will be added next
          </Text>
          <Text
            style={[styles.comingSoonSub, { color: colors.mutedForeground }]}
          >
            Create, edit, and publish your menu items from this screen.
          </Text>
        </View>
      </View>
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
  comingSoonCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    alignItems: 'flex-start',
  },
  comingSoonText: {
    flex: 1,
    gap: 4,
  },
  comingSoonTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  comingSoonSub: {
    fontSize: 13,
    lineHeight: 19,
  },
});
