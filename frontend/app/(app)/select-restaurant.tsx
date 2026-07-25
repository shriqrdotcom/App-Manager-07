import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useApp } from '@/src/providers/AppProvider';
import colors from '@/src/constants/colors';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner', admin: 'Admin', manager: 'Manager', staff: 'Staff',
};

export default function SelectRestaurant() {
  const { bootstrap, selectRestaurant, logout } = useApp();
  const restaurants = bootstrap?.restaurants ?? [];

  return (
    <View style={styles.container} testID="select-restaurant-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Select restaurant</Text>
        <Text style={styles.subtitle}>
          {bootstrap?.user?.name ? `Hello, ${bootstrap.user.name}. Choose a restaurant to continue.` : 'Choose a restaurant to continue.'}
        </Text>
      </View>

      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingBottom: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={async () => {
                await selectRestaurant(item.id);
                router.replace('/(app)/tabs');
              }}
            activeOpacity={0.75}
            testID={`restaurant-card-${item.id}`}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name.split(' ').slice(0, 2).map((w) => w[0]).join('')}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <View style={styles.rolePill}>
                <Text style={styles.roleText}>{ROLE_LABELS[item.role] ?? item.role}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7} testID="select-restaurant-sign-out">
        <Feather name="log-out" size={14} color={colors.mutedForeground} />
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 8 },
  header: { paddingHorizontal: 20, paddingBottom: 16, gap: 6 },
  title: { fontSize: 28, fontWeight: '800', color: colors.foreground, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1,
    borderRadius: 14, padding: 14,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#2A2B2C',
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.foreground, fontSize: 14, fontWeight: '700' },
  name: { color: colors.foreground, fontSize: 15.5, fontWeight: '700' },
  rolePill: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
    borderRadius: 4, backgroundColor: '#242526', borderWidth: 1, borderColor: colors.border,
  },
  roleText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, color: colors.mutedForeground },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 13, color: colors.mutedForeground },
});
