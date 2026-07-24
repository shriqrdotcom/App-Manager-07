import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/src/constants/colors';
import { useApp } from '@/src/providers/AppProvider';

// ---------- Menu data ----------
type Category = { key: string; label: string; emoji: string; tint: string };

const CATEGORIES: Category[] = [
  { key: 'biryani', label: 'Biryani',  emoji: '🍛', tint: '#FDE68A' },
  { key: 'pizzas',  label: 'Pizzas',   emoji: '🍕', tint: '#FCA5A5' },
  { key: 'burgers', label: 'Burgers',  emoji: '🍔', tint: '#FBBF24' },
  { key: 'rolls',   label: 'Rolls',    emoji: '🌯', tint: '#FDBA74' },
  { key: 'momos',   label: 'Momos',    emoji: '🥟', tint: '#FDE68A' },
  { key: 'drinks',  label: 'Drinks',   emoji: '🥤', tint: '#93C5FD' },
  { key: 'desserts',label: 'Desserts', emoji: '🍰', tint: '#F9A8D4' },
];

type Dish = {
  id: string; name: string; category: string;
  price: number; oldPrice?: number; veg: boolean;
  source: string; prep: string; rating: number; reviews: number;
  emoji: string;
};

const DISHES: Dish[] = [
  // Biryani
  { id: 'b1', name: 'Hyderabadi Chicken Biryani', category: 'biryani', price: 289, oldPrice: 349, veg: false, source: 'Signature Kitchen', prep: '25-30 mins', rating: 4.5, reviews: 326, emoji: '🍛' },
  { id: 'b2', name: 'Paneer Biryani',             category: 'biryani', price: 249, oldPrice: 299, veg: true,  source: 'Signature Kitchen', prep: '20-25 mins', rating: 4.4, reviews: 218, emoji: '🍚' },
  // Pizzas
  { id: 'p1', name: 'Margherita Classic',         category: 'pizzas',  price: 249, oldPrice: 329, veg: true,  source: 'Wood-fired Oven',    prep: '20-25 mins', rating: 4.6, reviews: 512, emoji: '🍕' },
  { id: 'p2', name: 'Peri Peri Chicken Pizza',    category: 'pizzas',  price: 349, oldPrice: 429, veg: false, source: 'Wood-fired Oven',    prep: '25-30 mins', rating: 4.5, reviews: 289, emoji: '🍕' },
  // Burgers
  { id: 'u1', name: 'Truffle Cheese Burger',      category: 'burgers', price: 279, oldPrice: 349, veg: false, source: 'Grill Bar',          prep: '15-20 mins', rating: 4.7, reviews: 401, emoji: '🍔' },
  { id: 'u2', name: 'Crispy Veg Burger',          category: 'burgers', price: 169, oldPrice: 219, veg: true,  source: 'Grill Bar',          prep: '15-20 mins', rating: 4.3, reviews: 176, emoji: '🍔' },
  // Rolls
  { id: 'r1', name: 'Chicken Kathi Roll',         category: 'rolls',   price: 149, oldPrice: 189, veg: false, source: 'Street Kraft',       prep: '15-20 mins', rating: 4.4, reviews: 210, emoji: '🌯' },
  { id: 'r2', name: 'Paneer Tikka Roll',          category: 'rolls',   price: 129, oldPrice: 169, veg: true,  source: 'Street Kraft',       prep: '15-20 mins', rating: 4.3, reviews: 148, emoji: '🌯' },
  // Momos
  { id: 'm1', name: 'Chicken Classic Steam Momo', category: 'momos',   price: 99,  oldPrice: 189, veg: false, source: 'Momo Kraft',         prep: '30-35 mins', rating: 4.4, reviews: 15,  emoji: '🥟' },
  { id: 'm2', name: 'Chicken Pahari Fresh Momo',  category: 'momos',   price: 99,  oldPrice: 129, veg: false, source: 'Wow! Momo',          prep: '30-35 mins', rating: 4.5, reviews: 326, emoji: '🥟' },
  { id: 'm3', name: 'Veg Classic Steam Momo',     category: 'momos',   price: 69,  oldPrice: 169, veg: true,  source: 'Momo Kraft',         prep: '30-35 mins', rating: 4.2, reviews: 10,  emoji: '🥟' },
  { id: 'm4', name: 'Chicken Kraft Steam Momo',   category: 'momos',   price: 99,  oldPrice: 199, veg: false, source: 'Momo Kraft',         prep: '30-35 mins', rating: 5.0, reviews: 8,   emoji: '🥟' },
  // Drinks
  { id: 'd1', name: 'Fresh Lime Soda',            category: 'drinks',  price: 89,                veg: true,  source: 'Beverages',           prep: '5 mins',      rating: 4.5, reviews: 122, emoji: '🥤' },
  { id: 'd2', name: 'Cold Coffee',                category: 'drinks',  price: 129, oldPrice: 149, veg: true,  source: 'Beverages',           prep: '5-7 mins',    rating: 4.6, reviews: 88,  emoji: '☕' },
  // Desserts
  { id: 's1', name: 'Chocolate Lava Cake',        category: 'desserts',price: 159, oldPrice: 199, veg: true,  source: 'Pastry Bar',          prep: '10 mins',     rating: 4.7, reviews: 231, emoji: '🍰' },
  { id: 's2', name: 'Tiramisu',                   category: 'desserts',price: 189, oldPrice: 229, veg: true,  source: 'Pastry Bar',          prep: '5 mins',      rating: 4.8, reviews: 145, emoji: '🍰' },
];

export default function AddOrderScreen() {
  const insets = useSafeAreaInsets();
  const { state, selectedRestaurant } = useApp();

  const [customer, setCustomer] = useState('');
  const [tableNo, setTableNo] = useState('');
  const [category, setCategory] = useState<string>('biryani');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [placedMsg, setPlacedMsg] = useState<string | null>(null);

  const filtered = useMemo(() => DISHES.filter((d) => d.category === category), [category]);

  if (state === 'signed-out' || state === 'session-loading') return <Redirect href="/" />;
  if (!selectedRestaurant) return <Redirect href="/" />;

  const totalItems = Object.values(cart).reduce((s, n) => s + n, 0);
  const totalPrice = Object.entries(cart).reduce((s, [id, n]) => {
    const dish = DISHES.find((d) => d.id === id); return s + (dish ? dish.price * n : 0);
  }, 0);

  const add = useCallback((id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 })), []);
  const dec = useCallback((id: string) => setCart((c) => {
    const n = (c[id] ?? 0) - 1;
    const next = { ...c };
    if (n <= 0) delete next[id]; else next[id] = n;
    return next;
  }), []);

  const placeOrder = () => {
    setError(null);
    if (!customer.trim()) return setError('Enter customer name');
    if (!tableNo.trim()) return setError('Enter table number');
    if (totalItems === 0) return setError('Add at least one item to the order');
    setPlacedMsg(`Order placed for ${customer.trim()} · ${tableNo.trim()}`);
    setTimeout(() => router.replace('/(app)/orders'), 900);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="add-order-back" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        testID="add-order-screen"
        data={filtered}
        numColumns={2}
        keyExtractor={(d) => d.id}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom, gap: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {/* Customer + Table */}
            <View style={styles.custCard}>
              <Text style={styles.sectionLabel}>CUSTOMER DETAILS</Text>
              <View style={{ gap: 12 }}>
                <View style={styles.inputRow}>
                  <Feather name="user" size={16} color={colors.mutedForeground} />
                  <TextInput
                    testID="cust-name"
                    style={styles.input}
                    placeholder="Customer name"
                    placeholderTextColor={colors.mutedForeground}
                    value={customer}
                    onChangeText={setCustomer}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.inputRow}>
                  <Feather name="hash" size={16} color={colors.mutedForeground} />
                  <TextInput
                    testID="cust-table"
                    style={styles.input}
                    placeholder="Table number (e.g. T-07)"
                    placeholderTextColor={colors.mutedForeground}
                    value={tableNo}
                    onChangeText={setTableNo}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </View>

            {/* Category ring (styled to reference) */}
            <View style={styles.categoryBoard}>
              <Text style={styles.categoryHeading}>What&apos;s on your mind?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                {CATEGORIES.map((c) => {
                  const active = c.key === category;
                  return (
                    <TouchableOpacity
                      key={c.key}
                      onPress={() => setCategory(c.key)}
                      activeOpacity={0.85}
                      style={styles.catItem}
                      testID={`cat-${c.key}`}
                    >
                      <View style={[styles.catCircle, { backgroundColor: c.tint }, active && styles.catCircleActive]}>
                        <Text style={{ fontSize: 40 }}>{c.emoji}</Text>
                      </View>
                      <Text style={[styles.catLabel, active && styles.catLabelActive]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Menu section header */}
            <View style={styles.menuHeader}>
              <Text style={styles.menuHeaderText}>All {filtered.length} Items</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <DishCard
            dish={item}
            qty={cart[item.id] ?? 0}
            onAdd={() => add(item.id)}
            onDec={() => dec(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: colors.mutedForeground }}>No items in this category</Text>
          </View>
        }
      />

      {/* Bottom summary bar */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {error && (
          <View style={styles.errorBar} testID="add-order-error">
            <Feather name="alert-circle" size={13} color={colors.destructive} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.footerCount}>{totalItems} item{totalItems === 1 ? '' : 's'}</Text>
            <Text style={styles.footerTotal}>₹{totalPrice.toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.submitBtn, (totalItems === 0) && { opacity: 0.6 }]}
            onPress={placeOrder}
            disabled={totalItems === 0}
            testID="add-order-place"
            activeOpacity={0.9}
          >
            <Feather name="check" size={16} color={colors.background} />
            <Text style={styles.submitBtnText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      </View>

      {placedMsg && (
        <View style={[styles.successToast, { bottom: insets.bottom + 100 }]} testID="add-order-success">
          <Feather name="check-circle" size={16} color={colors.success} />
          <Text style={styles.successText}>{placedMsg}</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ---------- Dish card (Swiggy-like) ----------
function DishCard({ dish, qty, onAdd, onDec }: { dish: Dish; qty: number; onAdd: () => void; onDec: () => void }) {
  const hasDiscount = dish.oldPrice && dish.oldPrice > dish.price;
  return (
    <View style={styles.dishCard} testID={`dish-${dish.id}`}>
      {/* Photo */}
      <View style={styles.dishPhotoWrap}>
        <View style={styles.dishPhoto}>
          <Text style={{ fontSize: 56 }}>{dish.emoji}</Text>
        </View>
        {hasDiscount && (
          <View style={styles.pricePill}>
            <Text style={styles.pricePillText}>₹{dish.price}</Text>
          </View>
        )}
        <View style={[styles.vegBox, { borderColor: dish.veg ? '#22C55E' : '#EF4444' }]}>
          <View style={[styles.vegDot, { backgroundColor: dish.veg ? '#22C55E' : '#EF4444' }]} />
        </View>
      </View>

      {/* Rating */}
      <View style={styles.ratingRow}>
        <View style={styles.ratingPill}>
          <Feather name="star" size={10} color="#065F46" />
          <Text style={styles.ratingText}>{dish.rating.toFixed(1)} ({dish.reviews})</Text>
        </View>
      </View>

      {/* Name */}
      <Text style={styles.dishName} numberOfLines={2}>{dish.name}</Text>

      {/* Price + Add */}
      <View style={styles.priceRow}>
        <View style={styles.priceBlock}>
          {hasDiscount ? (
            <>
              <Text style={styles.oldPrice}>₹{dish.oldPrice}</Text>
              <Text style={styles.currentPrice}>₹{dish.price}</Text>
            </>
          ) : (
            <Text style={styles.currentPrice}>₹{dish.price}</Text>
          )}
        </View>

        {qty === 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.85} testID={`dish-add-${dish.id}`}>
            <Text style={styles.addBtnText}>ADD</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyBox} testID={`dish-qty-${dish.id}`}>
            <TouchableOpacity onPress={onDec} style={styles.qtyIcon} testID={`dish-dec-${dish.id}`}>
              <Feather name="minus" size={14} color="#10B981" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{qty}</Text>
            <TouchableOpacity onPress={onAdd} style={styles.qtyIcon} testID={`dish-inc-${dish.id}`}>
              <Feather name="plus" size={14} color="#10B981" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.dishMeta} numberOfLines={1}>{dish.source}</Text>
      <Text style={styles.dishMetaMuted} numberOfLines={1}>{dish.prep}</Text>
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#1B1C1C',
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: colors.foreground, fontSize: 17, fontWeight: '700' },

  // Customer section
  custCard: {
    marginHorizontal: 16, marginTop: 16, marginBottom: 8,
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 10,
  },
  sectionLabel: {
    fontSize: 10.5, fontWeight: '700', color: colors.mutedForeground,
    letterSpacing: 1, marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0F1010', borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 14,
  },
  input: {
    flex: 1, color: colors.foreground, fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
  },

  // Category section — mimics reference (white/light circles, bold labels)
  categoryBoard: {
    marginHorizontal: 16, marginTop: 4, marginBottom: 6,
    backgroundColor: '#FAFAFA', borderRadius: 20, padding: 16, paddingBottom: 20,
  },
  categoryHeading: {
    fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12,
    letterSpacing: -0.3,
  },
  catRow: { gap: 16, paddingRight: 8 },
  catItem: { alignItems: 'center', gap: 8, width: 80 },
  catCircle: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  catCircleActive: {
    borderWidth: 3, borderColor: '#111827',
  },
  catLabel: { fontSize: 13, fontWeight: '700', color: '#4B5563', textAlign: 'center' },
  catLabelActive: { color: '#111827' },

  // Menu section header
  menuHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  menuHeaderText: { fontSize: 20, fontWeight: '800', color: colors.foreground, letterSpacing: -0.4 },

  // Dish card — mimics reference (white card + photo + yellow price pill + ADD)
  dishCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 10,
    borderWidth: 1, borderColor: '#E5E7EB', gap: 4,
  },
  dishPhotoWrap: { position: 'relative' },
  dishPhoto: {
    width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#FFF7ED',
    alignItems: 'center', justifyContent: 'center',
  },
  pricePill: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: '#FCD34D', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
  },
  pricePillText: { color: '#111827', fontWeight: '800', fontSize: 12 },
  vegBox: {
    position: 'absolute', top: 6, left: 6, width: 14, height: 14, borderRadius: 2,
    borderWidth: 1.5, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  vegDot: { width: 6, height: 6, borderRadius: 3 },

  ratingRow: { flexDirection: 'row', marginTop: 6 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  ratingText: { color: '#065F46', fontSize: 10.5, fontWeight: '700' },

  dishName: { color: '#111827', fontSize: 13.5, fontWeight: '700', marginTop: 4, lineHeight: 18 },

  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  priceBlock: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  oldPrice: { color: '#9CA3AF', fontSize: 12, textDecorationLine: 'line-through' },
  currentPrice: { color: '#111827', fontSize: 15, fontWeight: '800' },

  addBtn: {
    borderWidth: 1.5, borderColor: '#10B981', backgroundColor: '#FFFFFF',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6,
  },
  addBtnText: { color: '#10B981', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },

  qtyBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#10B981', borderRadius: 6, backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  qtyIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: '#10B981', fontWeight: '800', fontSize: 13, minWidth: 20, textAlign: 'center' },

  dishMeta: { color: '#4B5563', fontSize: 11, fontWeight: '600', marginTop: 4 },
  dishMetaMuted: { color: '#9CA3AF', fontSize: 11 },

  // Footer
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
    backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 12, gap: 8,
  },
  errorBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#3B1D1D', borderColor: '#7F1D1D', borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8,
  },
  errorText: { color: '#F87171', fontSize: 12.5, flex: 1 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerCount: { color: colors.mutedForeground, fontSize: 11.5, fontWeight: '600' },
  footerTotal: { color: colors.foreground, fontSize: 20, fontWeight: '800' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.foreground, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 12,
  },
  submitBtnText: { color: colors.background, fontWeight: '800', fontSize: 14.5 },

  successToast: {
    position: 'absolute', alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0F2D1A', borderWidth: 1, borderColor: '#22C55E',
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12,
  },
  successText: { color: '#86EFAC', fontSize: 13.5, fontWeight: '700' },
});
