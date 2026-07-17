import React from 'react';
import {
  FlatList,
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
import type { BootstrapRestaurant } from '@/types/bootstrap';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
};

export default function SelectRestaurant() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { bootstrap, selectRestaurant, logout } = useApp();

  const restaurants = bootstrap?.restaurants ?? [];

  const handleSelect = async (restaurant: BootstrapRestaurant) => {
    await Haptics.selectionAsync();
    await selectRestaurant(restaurant.id);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Select Restaurant
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {bootstrap?.user?.name
            ? `Hello, ${bootstrap.user.name}. Choose a restaurant to continue.`
            : 'Choose a restaurant to continue.'}
        </Text>
      </View>

      {/* Restaurant list */}
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={restaurants.length > 4}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.restaurantCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => handleSelect(item)}
            activeOpacity={0.75}
          >
            <View
              style={[styles.roleTag, { backgroundColor: colors.primary + '1A' }]}
            >
              <Text style={[styles.roleText, { color: colors.primary }]}>
                {ROLE_LABELS[item.role] ?? item.role}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.restaurantName, { color: colors.foreground }]}>
                {item.name}
              </Text>
              <Feather
                name="chevron-right"
                size={18}
                color={colors.mutedForeground}
              />
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Sign out */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
        activeOpacity={0.7}
      >
        <Feather name="log-out" size={15} color={colors.mutedForeground} />
        <Text style={[styles.logoutText, { color: colors.mutedForeground }]}>
          Sign out
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    gap: 6,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  listContent: {
    gap: 10,
  },
  separator: {
    height: 0,
  },
  restaurantCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  roleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  restaurantName: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 14,
  },
});
