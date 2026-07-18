import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
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
import { useMenu } from '@/hooks/useMenu';
import { CategoryChip } from '@/components/menu/CategoryChip';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import type { RestaurantRole } from '@/types/bootstrap';

const MENU_ROLES: RestaurantRole[] = ['owner', 'admin', 'manager'];

const ALL_CATEGORY_ID = '__all__';

export default function MenuScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedRestaurant, logout } = useApp();

  const role = selectedRestaurant?.role;
  const hasAccess = role !== undefined && MENU_ROLES.includes(role);

  const { categories, items, loadState, errorMessage, load } = useMenu(
    hasAccess ? (selectedRestaurant?.id ?? null) : null,
  );

  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>(ALL_CATEGORY_ID);
  const [refreshing, setRefreshing] = useState(false);

  // 401 → sign out and return to sign-in
  useEffect(() => {
    if (loadState === 'error-auth') {
      void logout();
    }
  }, [loadState, logout]);

  // Reset category filter when categories reload
  useEffect(() => {
    if (loadState === 'success') {
      setSelectedCategoryId(ALL_CATEGORY_ID);
    }
  }, [loadState]);

  const filteredItems = useMemo(() => {
    if (selectedCategoryId === ALL_CATEGORY_ID) return items;
    return items.filter((i) => i.categoryId === selectedCategoryId);
  }, [items, selectedCategoryId]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Haptics.selectionAsync();
    await load();
    setRefreshing(false);
  }, [load]);

  const handleBack = useCallback(async () => {
    await Haptics.selectionAsync();
    router.back();
  }, [router]);

  const handleCategoryPress = useCallback(
    async (id: string) => {
      await Haptics.selectionAsync();
      setSelectedCategoryId(id);
    },
    [],
  );

  const handleRetry = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await load();
  }, [load]);

  // ── Header ────────────────────────────────────────────────────────────────

  const ListHeader = useMemo(() => {
    if (!hasAccess || loadState === 'loading' || loadState === 'idle') {
      return null;
    }
    if (loadState !== 'success') return null;

    return (
      <View style={styles.listHeader}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          <CategoryChip
            label="All"
            selected={selectedCategoryId === ALL_CATEGORY_ID}
            onPress={() => void handleCategoryPress(ALL_CATEGORY_ID)}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              selected={selectedCategoryId === cat.id}
              onPress={() => void handleCategoryPress(cat.id)}
            />
          ))}
        </ScrollView>

        {/* Item count */}
        <Text style={[styles.itemCount, { color: colors.mutedForeground }]}>
          {filteredItems.length}{' '}
          {filteredItems.length === 1 ? 'item' : 'items'}
          {selectedCategoryId !== ALL_CATEGORY_ID &&
            categories.find((c) => c.id === selectedCategoryId)
              ? ` in ${categories.find((c) => c.id === selectedCategoryId)!.name}`
              : ''}
        </Text>
      </View>
    );
  }, [
    hasAccess,
    loadState,
    categories,
    selectedCategoryId,
    filteredItems.length,
    colors.mutedForeground,
    handleCategoryPress,
  ]);

  // ── Body content ──────────────────────────────────────────────────────────

  function renderBody() {
    // No access
    if (!hasAccess) {
      return (
        <FullScreenMessage
          icon="lock"
          title="Access restricted"
          message="Menu management is available to owners, admins, and managers."
          colors={colors}
        />
      );
    }

    // Loading
    if (loadState === 'idle' || loadState === 'loading') {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading menu…
          </Text>
        </View>
      );
    }

    // Auth error — effect triggers logout, show brief message
    if (loadState === 'error-auth') {
      return (
        <FullScreenMessage
          icon="log-out"
          title="Session expired"
          message="Signing you out…"
          colors={colors}
        />
      );
    }

    // Permission error (403)
    if (loadState === 'error-permission') {
      return (
        <FullScreenMessage
          icon="shield-off"
          title="Permission denied"
          message={errorMessage ?? 'You do not have permission to view this menu.'}
          colors={colors}
        />
      );
    }

    // Network error
    if (loadState === 'error-network') {
      return (
        <FullScreenMessage
          icon="wifi-off"
          title="No connection"
          message={errorMessage ?? 'Unable to reach the server. Please check your connection.'}
          colors={colors}
          action={{ label: 'Retry', onPress: () => void handleRetry() }}
        />
      );
    }

    // Server error
    if (loadState === 'error-server') {
      return (
        <FullScreenMessage
          icon="alert-circle"
          title="Something went wrong"
          message={errorMessage ?? 'An unexpected error occurred.'}
          colors={colors}
          action={{ label: 'Retry', onPress: () => void handleRetry() }}
        />
      );
    }

    // Success — empty menu
    if (items.length === 0) {
      return (
        <FullScreenMessage
          icon="menu"
          title="No menu items yet"
          message="Your menu is empty. Items will appear here once they are added."
          colors={colors}
        />
      );
    }

    // Success — empty category filter
    if (filteredItems.length === 0) {
      return (
        <>
          {ListHeader}
          <FullScreenMessage
            icon="filter"
            title="No items in this category"
            message="Try selecting a different category."
            colors={colors}
          />
        </>
      );
    }

    // Success — list
    return (
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MenuItemCard item={item} category={categoryMap.get(item.categoryId)} />
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* Navigation bar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          onPress={() => void handleBack()}
          activeOpacity={0.7}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.navCenter}>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>
            Menu
          </Text>
          {selectedRestaurant && (
            <Text
              style={[styles.navSubtitle, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {selectedRestaurant.name}
            </Text>
          )}
        </View>

        {/* Spacer to balance back button */}
        <View style={styles.navSpacer} />
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Body */}
      <View style={styles.body}>{renderBody()}</View>
    </View>
  );
}

// ── Helper component ─────────────────────────────────────────────────────────

interface MessageProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  message: string;
  colors: ReturnType<typeof useColors>;
  action?: { label: string; onPress: () => void };
}

function FullScreenMessage({ icon, title, message, colors, action }: MessageProps) {
  return (
    <View style={styles.centered}>
      <View
        style={[
          styles.messageIconWrap,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <Feather name={icon} size={28} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.messageTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      <Text style={[styles.messageBody, { color: colors.mutedForeground }]}>
        {message}
      </Text>
      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          activeOpacity={0.7}
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.retryLabel, { color: colors.primaryForeground }]}>
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  backBtn: {
    padding: 2,
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  navSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  navSpacer: {
    width: 26,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 4,
  },
  messageIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  messageBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 10,
  },
  retryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  listHeader: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  chipsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  itemCount: {
    fontSize: 12,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 24,
  },
});
