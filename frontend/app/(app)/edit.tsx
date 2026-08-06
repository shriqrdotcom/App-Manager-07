import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList, Modal, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View, Switch, useWindowDimensions,
} from 'react-native';
import Animated, {
  runOnJS, useAnimatedStyle, useSharedValue,
  withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, type ThemePalette } from '@/src/providers/ThemeProvider';
import staticColors from '@/src/constants/colors';
import { ScreenTitle, Card, SearchBar } from '@/src/components/ui';

type MenuItem = {
  id: string; name: string; category: string; price: number;
  veg: boolean; bestseller?: boolean; active: boolean; emoji: string;
};

type Combo = {
  id: string; name: string; items: string[]; price: number; oldPrice: number;
  active: boolean; emoji: string;
};

const INITIAL_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'Butter Chicken', category: 'Mains · North Indian', price: 480, veg: false, bestseller: true, active: true, emoji: '🍗' },
  { id: 'm2', name: 'Paneer Tikka Masala', category: 'Mains · North Indian', price: 420, veg: true, bestseller: true, active: true, emoji: '🧀' },
  { id: 'm3', name: 'Garlic Naan', category: 'Breads', price: 90, veg: true, active: true, emoji: '🥖' },
  { id: 'm4', name: 'Hyderabadi Biryani', category: 'Rice · Mains', price: 380, veg: false, active: true, emoji: '🍚' },
  { id: 'm5', name: 'Dal Makhani', category: 'Mains · North Indian', price: 320, veg: true, active: false, emoji: '🥘' },
  { id: 'm6', name: 'Mango Lassi', category: 'Beverages', price: 140, veg: true, active: true, emoji: '🥤' },
];

const INITIAL_COMBOS: Combo[] = [
  { id: 'c1', name: 'Family Feast', items: ['Butter Chicken', 'Naan Basket', 'Jeera Rice', 'Gulab Jamun (2)'], price: 1290, oldPrice: 1580, active: true, emoji: '🍱' },
  { id: 'c2', name: 'Veg Thali Deluxe', items: ['Paneer Tikka Masala', 'Dal Makhani', '3 Roti', 'Rice', 'Salad'], price: 620, oldPrice: 780, active: true, emoji: '🥗' },
  { id: 'c3', name: 'Biryani Bonanza', items: ['Chicken Biryani', 'Raita', 'Salan', 'Sweet'], price: 480, oldPrice: 590, active: false, emoji: '🍛' },
];

type StatusFilter = 'all' | 'active' | 'paused';
type MenuTab = 'items' | 'combos';

function makeStyles(colors: ThemePalette) {
  return StyleSheet.create({
    quickRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 14 },
    quickBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    quickBtnText: { color: colors.foreground, fontSize: 12.5, fontWeight: '600' },

    tabsWrap: { paddingHorizontal: 20, marginBottom: 12 },
    tabsRow: {
      flexDirection: 'row', backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 4,
    },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    tabBtnActive: { backgroundColor: colors.primary },
    tabText: { color: colors.mutedForeground, fontSize: 13, fontWeight: '600' },

    statusRow: { flexDirection: 'row', paddingLeft: 20, paddingRight: 20, paddingTop: 4, paddingBottom: 12, gap: 8, alignItems: 'center' },
    statusChip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexShrink: 0,
    },
    statusChipText: { color: colors.mutedForeground, fontSize: 12.5, fontWeight: '600' },

    itemCard: { marginHorizontal: 20, flexDirection: 'row', gap: 12, alignItems: 'center' },
    imgWrap: {
      width: 64, height: 64, borderRadius: 12, backgroundColor: colors.muted,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
    },
    vegDot: {
      position: 'absolute', top: 4, left: 4, width: 10, height: 10, borderRadius: 5,
      borderWidth: 1.5, borderColor: colors.muted,
    },
    itemName: { color: colors.foreground, fontSize: 14.5, fontWeight: '700' },
    itemCategory: { color: colors.mutedForeground, fontSize: 12 },
    itemPrice: { color: colors.foreground, fontSize: 15, fontWeight: '800' },
    itemRight: { alignItems: 'flex-end', gap: 6 },
    badge: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: '#F59E0B18', borderColor: '#F59E0B44', borderWidth: 1,
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999,
    },
    badgeText: { color: '#F5C577', fontSize: 9.5, fontWeight: '700' },
    statusDotPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    miniBtn: {
      width: 26, height: 26, borderRadius: 6, backgroundColor: colors.muted,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    },

    comboBanner: {
      width: '100%', height: 120, borderRadius: 12, overflow: 'hidden',
      backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center',
    },
    comboBannerOverlay: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingVertical: 8,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    comboBannerName: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
    oldPrice: { color: colors.mutedForeground, fontSize: 12, textDecorationLine: 'line-through' },
    saveBadge: { backgroundColor: '#22C55E22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    saveText: { color: '#4ADE80', fontSize: 10, fontWeight: '700' },
    ghostAction: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 9, borderRadius: 10, backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border,
    },
    ghostActionText: { color: colors.foreground, fontSize: 12.5, fontWeight: '600' },
    ghostActionDanger: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 9, borderRadius: 10, backgroundColor: '#3B1D1D', borderWidth: 1, borderColor: '#7F1D1D',
    },
    ghostActionDangerText: { color: staticColors.destructive, fontSize: 12.5, fontWeight: '600' },

    toast: {
      position: 'absolute', bottom: 24, alignSelf: 'center',
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10,
    },
    toastText: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
  });
}

type StylesType = ReturnType<typeof makeStyles>;

export default function EditMenu() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState<MenuTab>('items');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [combos, setCombos] = useState(INITIAL_COMBOS);
  const [toast, setToast] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 1800); };

  const filteredItems = useMemo(() => items.filter((it) => {
    if (search && !it.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (status === 'active' && !it.active) return false;
    if (status === 'paused' && it.active) return false;
    return true;
  }), [items, search, status]);

  const filteredCombos = useMemo(() => combos.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (status === 'active' && !c.active) return false;
    if (status === 'paused' && c.active) return false;
    return true;
  }), [combos, search, status]);

  const toggleItem = (id: string) => {
    setItems((prev) => prev.map((it) => {
      if (it.id === id) {
        const next = { ...it, active: !it.active };
        showToast(`${it.name} ${next.active ? 'activated' : 'paused'}`);
        return next;
      }
      return it;
    }));
  };

  const toggleCombo = (id: string) => {
    setCombos((prev) => prev.map((c) => {
      if (c.id === id) {
        const next = { ...c, active: !c.active };
        showToast(`${c.name} ${next.active ? 'published' : 'paused'}`);
        return next;
      }
      return c;
    }));
  };

  const handleEdit = useCallback((item: MenuItem) => { setEditingItem(item); }, []);
  const handleCloseSheet = useCallback(() => { setEditingItem(null); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 64 }}>
      <ScreenTitle testID="edit-title">Edit Menu</ScreenTitle>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search dishes or combos" testID="edit-search" />

      {/* Quick actions */}
      <View style={styles.quickRow}>
        <QuickBtn icon="plus" label="Add item" testID="qa-add" styles={styles} />
        <QuickBtn icon="layers" label="Combos" testID="qa-combos" styles={styles} />
        <QuickBtn icon="tag" label="Categories" testID="qa-categories" styles={styles} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <View style={styles.tabsRow}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'items' && styles.tabBtnActive]} onPress={() => setTab('items')} testID="edit-tab-items">
            <Text style={[styles.tabText, tab === 'items' && { color: colors.primaryForeground }]}>Menu items</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'combos' && styles.tabBtnActive]} onPress={() => setTab('combos')} testID="edit-tab-combos">
            <Text style={[styles.tabText, tab === 'combos' && { color: colors.primaryForeground }]}>Combo offers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status filters */}
      <View style={styles.statusRow}>
        {(['all', 'active', 'paused'] as StatusFilter[]).map((s) => {
          const active = status === s;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setStatus(s)}
              testID={`edit-status-${s}`}
              style={[styles.statusChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <Text style={[styles.statusChipText, active && { color: colors.primaryForeground }]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === 'items' ? (
        <FlatList
          testID="edit-items-list"
          data={filteredItems}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onToggle={() => toggleItem(item.id)}
              onEdit={() => handleEdit(item)}
              colors={colors}
              styles={styles}
            />
          )}
          ListEmptyComponent={<EmptyState label="No items match your filters" colors={colors} />}
        />
      ) : (
        <FlatList
          testID="edit-combos-list"
          data={filteredCombos}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => <ComboCard combo={item} onToggle={() => toggleCombo(item.id)} onAction={showToast} colors={colors} styles={styles} />}
          ListEmptyComponent={<EmptyState label="No combos match your filters" colors={colors} />}
        />
      )}

      {toast && (
        <View style={styles.toast} testID="edit-toast">
          <Feather name="check-circle" size={14} color={staticColors.success} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <MenuItemEditSheet item={editingItem} onClose={handleCloseSheet} />
    </View>
  );
}

// ─── iOS-style Bottom Sheet ────────────────────────────────────────────────────

const SPRING_CONFIG = {
  damping: 30,
  stiffness: 220,
  mass: 0.9,
  overshootClamping: true,
};

function MenuItemEditSheet({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const { colors } = useTheme();
  const { height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetH = screenH * 0.78;

  const translateY = useSharedValue(sheetH);
  const controlsTranslateY = useSharedValue(sheetH + 84);
  const overlayOpacity = useSharedValue(0);
  const cancelScale = useSharedValue(1);
  const [itemName, setItemName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [foodCategory, setFoodCategory] = useState<'veg' | 'nonveg'>('nonveg');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  const isOpen = item !== null;

  useEffect(() => {
    if (!item) return;
    setItemName(item.name);
    setSlug(item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    setDescription('');
    setPrice(String(item.price));
    setFoodCategory(item.veg ? 'veg' : 'nonveg');
    setOrientation('horizontal');
  }, [item]);

  // Open / close animations
  useEffect(() => {
    if (isOpen) {
      overlayOpacity.value = withTiming(1, { duration: 220 });
      translateY.value = withSpring(0, SPRING_CONFIG);
      controlsTranslateY.value = withSpring(0, SPRING_CONFIG);
    }
  }, [isOpen]);

  const dismiss = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 200 });
    controlsTranslateY.value = withSpring(sheetH + 84, SPRING_CONFIG);
    translateY.value = withSpring(sheetH, SPRING_CONFIG, () => {
      runOnJS(onClose)();
    });
  }, [sheetH, onClose]);

  // ESC key support (web)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) dismiss(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, dismiss]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const controlsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: controlsTranslateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cancelBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelScale.value }],
  }));

  if (!isOpen) return null;

  return (
    <Modal
      transparent
      visible
      statusBarTranslucent
      animationType="none"
      onRequestClose={dismiss}
      accessible={false}
    >
      {/* Dimmed overlay with blur */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#000' },
          overlayStyle,
        ]}
        pointerEvents="none"
      />

      {/* Backdrop blur layer (web uses CSS, native uses BlurView) */}
      {Platform.OS === 'web' ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              // @ts-ignore — web-only style
              backdropFilter: 'blur(7px)',
            },
            overlayStyle,
          ]}
          pointerEvents="none"
        />
      ) : null}

      {/* Tap-outside-to-dismiss */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={dismiss}
        accessible={false}
      />

      {/* Blank editor page. The controls intentionally sit outside this panel,
          matching the floating iOS sheet presentation in the reference. */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: sheetH,
            backgroundColor: '#171717',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            overflow: 'hidden',
          },
          sheetStyle,
        ]}
        // Prevent taps from falling through to backdrop
        onStartShouldSetResponder={() => true}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 24,
          }}
        >
          <FoodImageSection colors={colors} />
          <FoodItemDetailsSection
            colors={colors}
            itemName={itemName}
            onItemNameChange={setItemName}
            slug={slug}
            onSlugChange={setSlug}
            description={description}
            onDescriptionChange={setDescription}
            price={price}
            onPriceChange={setPrice}
            foodCategory={foodCategory}
            onFoodCategoryChange={setFoodCategory}
            orientation={orientation}
            onOrientationChange={setOrientation}
          />
        </ScrollView>
      </Animated.View>

      {/* Floating controls. Their bottom edge stays 28px above the panel,
          leaving the deliberate gap visible in the reference image. */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 24,
            right: 24,
            bottom: sheetH + 28,
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
          sheetStyle,
        ]}
        pointerEvents="box-none"
      >
        {/* Cancel — Liquid Glass */}
        <Animated.View style={cancelBtnStyle}>
          <Pressable
            aria-label="Close editor"
            accessibilityRole="button"
            accessibilityLabel="Close editor"
            onPressIn={() => { cancelScale.value = withSpring(0.97, { damping: 20, stiffness: 400 }); }}
            onPressOut={() => { cancelScale.value = withSpring(1, { damping: 20, stiffness: 400 }); }}
            onPress={dismiss}
            style={{ width: 56, height: 56, borderRadius: 28, overflow: 'hidden' }}
          >
            <LiquidGlassButton />
          </Pressable>
        </Animated.View>

        {/* Confirm — iOS Blue */}
        <Pressable
          aria-label="Confirm"
          accessibilityRole="button"
          accessibilityLabel="Confirm"
          onPress={dismiss}
          style={({ pressed }) => [
            {
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: pressed ? '#0070E0' : '#0A84FF',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#0A84FF',
              shadowOpacity: 0.5,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            },
          ]}
        >
          <Feather name="check" size={22} color="#fff" />
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

function FoodImageSection({ colors }: { colors: ThemePalette }) {
  return (
    <View
      style={{
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
      }}
    >
      <View
        style={{
          width: '100%',
          aspectRatio: 1.6,
          minHeight: 150,
          maxHeight: 300,
          borderRadius: 13,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.10)',
          borderStyle: 'dashed',
          backgroundColor: '#252525',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
        testID="food-image-preview"
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <Feather name="image" size={21} color={colors.mutedForeground} />
        </View>
        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '600' }}>
          Add food image
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
          JPG or PNG · up to 10 MB
        </Text>
      </View>
    </View>
  );
}

type FoodItemDetailsProps = {
  colors: ThemePalette;
  itemName: string;
  onItemNameChange: (value: string) => void;
  slug: string;
  onSlugChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  price: string;
  onPriceChange: (value: string) => void;
  foodCategory: 'veg' | 'nonveg';
  onFoodCategoryChange: (value: 'veg' | 'nonveg') => void;
  orientation: 'horizontal' | 'vertical';
  onOrientationChange: (value: 'horizontal' | 'vertical') => void;
};

function FoodItemDetailsSection({
  colors,
  itemName,
  onItemNameChange,
  slug,
  onSlugChange,
  description,
  onDescriptionChange,
  price,
  onPriceChange,
  foodCategory,
  onFoodCategoryChange,
  orientation,
  onOrientationChange,
}: FoodItemDetailsProps) {
  const { width } = useWindowDimensions();
  const [dietMenuOpen, setDietMenuOpen] = useState(false);
  const twoColumns = width >= 620;

  return (
    <View
      style={{
        width: '100%',
        maxWidth: 720,
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        gap: 16,
      }}
      testID="food-item-details"
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '800' }}>
          Food item details
        </Text>
        <View style={{ position: 'relative', zIndex: 10 }}>
          <TouchableOpacity
            onPress={() => setDietMenuOpen((open) => !open)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open dietary preference menu"
            accessibilityState={{ expanded: dietMenuOpen }}
            testID="food-item-diet-menu"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Feather name="more-vertical" size={18} color={colors.foreground} />
          </TouchableOpacity>

          {dietMenuOpen && (
            <View
              style={{
                position: 'absolute',
                top: 42,
                right: 0,
                minWidth: 158,
                padding: 10,
                borderRadius: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                shadowColor: '#000',
                shadowOpacity: 0.35,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }}
              testID="food-item-diet-menu-content"
            >
              <DietToggle
                colors={colors}
                value={foodCategory}
                onChange={(nextValue) => {
                  onFoodCategoryChange(nextValue);
                  setDietMenuOpen(false);
                }}
              />
            </View>
          )}
        </View>
      </View>

      <View style={{ flexDirection: twoColumns ? 'row' : 'column', gap: 14 }}>
        <View style={{ flex: 1 }}>
          <FormField
            colors={colors}
            label="Item name"
            value={itemName}
            onChangeText={onItemNameChange}
            placeholder="e.g. Truffle Beef Carpaccio"
            testID="food-item-name"
          />
        </View>
        <View style={{ flex: 1 }}>
          <FormField
            colors={colors}
            label="Price"
            value={price}
            onChangeText={onPriceChange}
            placeholder="0"
            keyboardType="decimal-pad"
            prefix="₹"
            testID="food-item-price"
          />
        </View>
      </View>

      <FormField
        colors={colors}
        label="URL slug"
        value={slug}
        onChangeText={onSlugChange}
        placeholder="truffle-beef-carpaccio"
        helperText="Used in the public URL for this menu item."
        testID="food-item-slug"
      />

      <View style={{ gap: 7 }}>
        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>
          Description
        </Text>
        <TextInput
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="Add a short description of this dish"
          placeholderTextColor={colors.mutedForeground}
          multiline
          textAlignVertical="top"
          style={{
            minHeight: 92,
            paddingHorizontal: 12,
            paddingVertical: 11,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.foreground,
            fontSize: 13,
          }}
          testID="food-item-description"
        />
      </View>

      <View style={{ flexDirection: twoColumns ? 'row' : 'column', gap: 14 }}>
        <ChoiceGroup
          colors={colors}
          label="Category"
          options={[
            { label: 'Veg', value: 'veg' },
            { label: 'Non-Veg', value: 'nonveg' },
          ]}
          value={foodCategory}
          onChange={onFoodCategoryChange}
          testID="food-item-category"
        />
        <ChoiceGroup
          colors={colors}
          label="Image orientation"
          options={[
            { label: 'Horizontal', value: 'horizontal' },
            { label: 'Vertical', value: 'vertical' },
          ]}
          value={orientation}
          onChange={onOrientationChange}
          testID="food-item-orientation"
        />
      </View>
    </View>
  );
}

function DietToggle({
  colors,
  value,
  onChange,
}: {
  colors: ThemePalette;
  value: 'veg' | 'nonveg';
  onChange: (value: 'veg' | 'nonveg') => void;
}) {
  const isVeg = value === 'veg';

  return (
    <TouchableOpacity
      onPress={() => onChange(isVeg ? 'nonveg' : 'veg')}
      activeOpacity={0.85}
      accessibilityRole="switch"
      accessibilityLabel="Toggle vegetarian item"
      accessibilityState={{ checked: isVeg }}
      testID="food-item-diet-toggle"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        flexShrink: 0,
      }}
    >
      <Text
        style={{
          color: isVeg ? '#4ADE80' : colors.mutedForeground,
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.7,
        }}
      >
        {isVeg ? 'VEG' : 'NON-VEG'}
      </Text>
      <View
        style={{
          width: 42,
          height: 24,
          padding: 3,
          borderRadius: 999,
          justifyContent: 'center',
          backgroundColor: isVeg ? '#16A34A' : colors.accent,
          borderWidth: 1,
          borderColor: isVeg ? '#22C55E' : colors.border,
        }}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: '#F5F5F5',
            alignSelf: isVeg ? 'flex-end' : 'flex-start',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
          }}
        />
      </View>
    </TouchableOpacity>
  );
}

function FormField({
  colors,
  label,
  value,
  onChangeText,
  placeholder,
  helperText,
  keyboardType,
  prefix,
  testID,
}: {
  colors: ThemePalette;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  keyboardType?: 'default' | 'decimal-pad';
  prefix?: string;
  testID?: string;
}) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 44,
          paddingHorizontal: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        {prefix && (
          <Text style={{ color: colors.mutedForeground, fontSize: 13, marginRight: 6 }}>
            {prefix}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            flex: 1,
            minWidth: 0,
            color: colors.foreground,
            fontSize: 13,
            paddingVertical: 10,
          }}
          testID={testID}
        />
      </View>
      {helperText && (
        <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16 }}>
          {helperText}
        </Text>
      )}
    </View>
  );
}

function ChoiceGroup<T extends string>({
  colors,
  label,
  options,
  value,
  onChange,
  testID,
}: {
  colors: ThemePalette;
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
}) {
  return (
    <View style={{ flex: 1, gap: 7 }}>
      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          padding: 3,
          borderRadius: 12,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        testID={testID}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                minHeight: 36,
                paddingHorizontal: 7,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? colors.primary : 'transparent',
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: selected ? colors.primaryForeground : colors.mutedForeground,
                  fontSize: 11.5,
                  fontWeight: '700',
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function LiquidGlassButton() {
  // Frosted glass cancel button with a restrained reflective surface.
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        backgroundColor: 'rgba(74,74,80,0.46)',
        shadowColor: '#000',
        shadowOpacity: 0.38,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 8,
      }}
    >
      {Platform.OS !== 'web' ? (
        <BlurView
          intensity={42}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              // @ts-ignore — web CSS
              backdropFilter: 'blur(24px)',
              backgroundColor: 'rgba(255,255,255,0.06)',
            },
          ]}
        />
      )}
      {/* Soft glass reflection, brighter at the upper-left edge */}
      <LinearGradient
        colors={['rgba(255,255,255,0.17)', 'rgba(255,255,255,0.035)', 'rgba(0,0,0,0.15)']}
        start={{ x: 0.12, y: 0.05 }}
        end={{ x: 0.88, y: 0.95 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Edge lighting and a subtle inner rim */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: 28,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.28)',
          },
        ]}
      />
      {/* Inner top highlight */}
      <View
        style={{
          position: 'absolute', top: 1, left: 8, right: 8, height: 1,
          backgroundColor: 'rgba(255,255,255,0.42)',
          borderBottomLeftRadius: 1,
          borderBottomRightRadius: 1,
        }}
      />
      {/* Lower glass tint keeps the control legible without flattening the blur */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(18,18,20,0.18)', borderRadius: 28 },
        ]}
      />
      {/* X icon centered */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="x" size={21} color="rgba(255,255,255,0.96)" />
      </View>
    </View>
  );
}

// ─── Supporting components ─────────────────────────────────────────────────────

function EmptyState({ label, colors }: { label: string; colors: ThemePalette }) {
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingTop: 32 }}>
      <Feather name="package" size={26} color={colors.mutedForeground} />
      <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function QuickBtn({ icon, label, testID, styles }: { icon: keyof typeof Feather.glyphMap; label: string; testID?: string; styles: StylesType }) {
  return (
    <TouchableOpacity style={styles.quickBtn} activeOpacity={0.8} testID={testID}>
      <Feather name={icon} size={14} color={staticColors.foreground} />
      <Text style={styles.quickBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function ItemCard({
  item, onToggle, onEdit, colors, styles,
}: {
  item: MenuItem; onToggle: () => void; onEdit: () => void; colors: ThemePalette; styles: StylesType;
}) {
  return (
    <Card style={styles.itemCard} testID={`menu-item-${item.id}`}>
      <View style={styles.imgWrap}>
        <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
        <View style={[styles.vegDot, { backgroundColor: item.veg ? '#22C55E' : '#EF4444' }]} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          {item.bestseller && (
            <View style={styles.badge}>
              <Feather name="star" size={9} color="#F59E0B" />
              <Text style={styles.badgeText}>Bestseller</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemCategory} numberOfLines={1}>{item.category}</Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>
      <View style={styles.itemRight}>
        <View style={[styles.statusDotPill, { backgroundColor: item.active ? '#22C55E22' : '#8A8A8E22' }]}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: item.active ? '#4ADE80' : colors.mutedForeground }}>
            {item.active ? 'Active' : 'Paused'}
          </Text>
        </View>
        <Switch
          value={item.active}
          onValueChange={onToggle}
          trackColor={{ true: colors.primary, false: colors.accent }}
          thumbColor={item.active ? colors.primaryForeground : colors.mutedForeground}
          testID={`menu-toggle-${item.id}`}
        />
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity style={styles.miniBtn} onPress={onEdit} testID={`menu-edit-${item.id}`}>
            <Feather name="edit-2" size={13} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

function ComboCard({ combo, onToggle, onAction, colors, styles }: { combo: Combo; onToggle: () => void; onAction: (m: string) => void; colors: ThemePalette; styles: StylesType }) {
  const saving = combo.oldPrice - combo.price;
  return (
    <Card style={{ marginHorizontal: 20, gap: 0, overflow: 'hidden', padding: 0 }} testID={`combo-${combo.id}`}>
      <View style={styles.comboBanner}>
        <Text style={{ fontSize: 56 }}>{combo.emoji}</Text>
        <View style={styles.comboBannerOverlay}>
          <Text style={styles.comboBannerName} numberOfLines={1}>{combo.name}</Text>
          <View style={[styles.statusDotPill, { backgroundColor: combo.active ? '#22C55E44' : '#8A8A8E33' }]}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: combo.active ? '#4ADE80' : '#aaa' }}>
              {combo.active ? 'Active' : 'Paused'}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, gap: 6 }}>
        <Text style={styles.itemCategory} numberOfLines={2}>{combo.items.join(' · ')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={styles.itemPrice}>₹{combo.price}</Text>
          <Text style={styles.oldPrice}>₹{combo.oldPrice}</Text>
          <View style={styles.saveBadge}>
            <Text style={styles.saveText}>Save ₹{saving}</Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 6 }}>
        <TouchableOpacity style={styles.ghostAction} testID={`combo-edit-${combo.id}`}>
          <Feather name="edit-2" size={13} color={colors.foreground} />
          <Text style={styles.ghostActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostAction} onPress={onToggle} testID={`combo-toggle-${combo.id}`}>
          <Feather name={combo.active ? 'pause-circle' : 'play-circle'} size={13} color={colors.foreground} />
          <Text style={styles.ghostActionText}>{combo.active ? 'Pause' : 'Publish'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostActionDanger} onPress={() => onAction(`${combo.name} deleted`)} testID={`combo-delete-${combo.id}`}>
          <Feather name="trash-2" size={13} color={staticColors.destructive} />
          <Text style={styles.ghostActionDangerText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}
