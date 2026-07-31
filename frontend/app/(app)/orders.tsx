import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated';
import { useTheme, type ThemePalette } from '@/src/providers/ThemeProvider';
import staticColors from '@/src/constants/colors';
import { ScreenTitle, Card } from '@/src/components/ui';
import { useScrollHeader } from '@/src/providers/ScrollHeaderProvider';

const TAB_INDEX = 0;

type Status = 'new' | 'confirmed' | 'preparing' | 'ready';
type OrderType = 'dine-in' | 'takeaway' | 'delivery';
type Payment = 'unpaid' | 'paid';

type OrderItem = { qty: number; name: string; price: number };
type Order = {
  id: string;
  number: string;
  received: string;
  status: Status;
  type: OrderType;
  table?: string;
  customer: string;
  phone?: string;
  items: OrderItem[];
  note?: string;
  total: number;
  payment: Payment;
};

const MOCK: Order[] = [
  {
    id: '1', number: '#4821', received: '2 min ago', status: 'new', type: 'dine-in', table: 'T-07',
    customer: 'Aarav Menon',
    items: [
      { qty: 1, name: 'Butter Chicken', price: 480 },
      { qty: 2, name: 'Garlic Naan', price: 270 },
      { qty: 1, name: 'Jeera Rice', price: 220 },
    ],
    note: 'Less spicy, extra butter on naan',
    total: 970, payment: 'unpaid',
  },
  {
    id: '2', number: '#4822', received: '5 min ago', status: 'new', type: 'delivery',
    customer: 'Priya Shah', phone: '+91 98220 33044',
    items: [
      { qty: 2, name: 'Paneer Tikka Masala', price: 420 },
      { qty: 2, name: 'Tandoori Roti', price: 240 },
      { qty: 2, name: 'Mango Lassi', price: 280 },
    ],
    total: 940, payment: 'paid',
  },
  {
    id: '3', number: '#4820', received: '12 min ago', status: 'confirmed', type: 'dine-in', table: 'T-11',
    customer: 'Rohan Kapoor',
    items: [ { qty: 1, name: 'Rogan Josh', price: 520 }, { qty: 1, name: 'Naan Basket', price: 180 } ],
    total: 700, payment: 'unpaid',
  },
  {
    id: '4', number: '#4819', received: '18 min ago', status: 'preparing', type: 'takeaway',
    customer: 'Meera Iyer',
    items: [ { qty: 1, name: 'Biryani (Chicken)', price: 380 }, { qty: 1, name: 'Raita', price: 60 } ],
    total: 440, payment: 'paid',
  },
  {
    id: '5', number: '#4818', received: '25 min ago', status: 'ready', type: 'delivery',
    customer: 'Neha Verma', phone: '+91 90111 55432',
    items: [ { qty: 2, name: 'Veg Thali', price: 620 } ],
    total: 620, payment: 'paid',
  },
];

const FILTERS: { key: Status; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: staticColors.info },
  { key: 'confirmed', label: 'Confirmed', color: staticColors.purple },
  { key: 'preparing', label: 'Preparing', color: staticColors.warning },
  { key: 'ready', label: 'Ready', color: staticColors.success },
];

const STATUS_STYLE: Record<Status, { bg: string; color: string; label: string }> = {
  new: { bg: '#F59E0B22', color: '#F59E0B', label: 'New' },
  confirmed: { bg: '#8B5CF622', color: '#A78BFA', label: 'Confirmed' },
  preparing: { bg: '#3B82F622', color: '#60A5FA', label: 'Preparing' },
  ready: { bg: '#22C55E22', color: '#4ADE80', label: 'Ready' },
};

const TYPE_ICON: Record<OrderType, keyof typeof Feather.glyphMap> = {
  'dine-in': 'coffee', takeaway: 'shopping-bag', delivery: 'truck',
};

function fmt(n: number) { return `₹${n.toLocaleString('en-IN')}`; }

function makeStyles(colors: ThemePalette) {
  return StyleSheet.create({
    headerActions: { flexDirection: 'row', gap: 8 },
    iconBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginBottom: 12 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: staticColors.success },
    liveText: { color: colors.mutedForeground, fontSize: 12 },

    summaryRow: { paddingHorizontal: 16, gap: 6, marginBottom: 14, flexDirection: 'row' },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      padding: 10,
    },
    summaryAccent: { width: 20, height: 2, borderRadius: 1, marginBottom: 6 },
    summaryLabel: { fontSize: 8, fontWeight: '700', color: colors.mutedForeground, letterSpacing: 0.8 },
    summaryValue: { fontSize: 15, fontWeight: '800', color: colors.foreground, marginTop: 3 },

    chipsRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 12, alignItems: 'center' },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      height: 34, paddingHorizontal: 12, borderRadius: 999,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      flexShrink: 0,
    },
    chipActive: { backgroundColor: colors.accent, borderColor: colors.border },
    chipDot: { width: 6, height: 6, borderRadius: 3 },
    chipLabel: { color: colors.mutedForeground, fontSize: 12.5, fontWeight: '600' },
    chipCount: {
      minWidth: 20, height: 18, borderRadius: 9, backgroundColor: colors.accent,
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
    },
    chipCountText: { fontSize: 10, fontWeight: '700', color: colors.foreground },

    orderCard: { marginHorizontal: 20, gap: 10, padding: 16 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    orderNumber: { fontSize: 15, fontWeight: '700', color: colors.foreground },
    dot: { color: colors.mutedForeground },
    orderTime: { fontSize: 12, color: colors.mutedForeground },
    statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    metaChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.muted, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
      borderWidth: 1, borderColor: colors.border,
    },
    metaText: { color: colors.mutedForeground, fontSize: 11, fontWeight: '600' },
    customer: { color: colors.foreground, fontSize: 12, fontWeight: '600' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 2 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    itemQty: { color: colors.mutedForeground, fontSize: 12, width: 22 },
    itemName: { flex: 1, color: colors.foreground, fontSize: 13 },
    itemPrice: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
    noteBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: '#F59E0B12', borderWidth: 1, borderColor: '#F59E0B33',
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    },
    noteText: { color: '#F5C577', fontSize: 12, flex: 1 },
    footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    totalLabel: { color: colors.mutedForeground, fontSize: 11 },
    totalValue: { color: colors.foreground, fontSize: 18, fontWeight: '800' },
    payPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    ghostBtn: {
      paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
      borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent',
    },
    ghostBtnText: { color: colors.mutedForeground, fontSize: 13, fontWeight: '600' },
    primaryBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.primary },
    primaryBtnText: { color: colors.primaryForeground, fontSize: 13, fontWeight: '700' },
    empty: { alignItems: 'center', gap: 8, paddingTop: 32 },
    emptyText: { color: colors.mutedForeground, fontSize: 13 },

    fab: {
      position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 16,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
  });
}

export default function Orders() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [filter, setFilter] = useState<Status>('new');
  const { scrollY, reportTabScroll } = useScrollHeader();
  const updatePos = useCallback((y: number) => { reportTabScroll(TAB_INDEX, y); }, [reportTabScroll]);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
    runOnJS(updatePos)(e.contentOffset.y);
  });

  const data = useMemo(() => MOCK.filter((o) => o.status === filter), [filter]);
  const counts = useMemo(() => {
    const c: Record<Status, number> = { new: 0, confirmed: 0, preparing: 0, ready: 0 };
    MOCK.forEach((o) => { c[o.status]++; });
    return c;
  }, []);

  const summary = useMemo(() => ({
    active: MOCK.filter((o) => o.status === 'preparing' || o.status === 'confirmed').length,
    pending: counts.new,
    avgPrep: '14m',
    revenue: fmt(MOCK.reduce((s, o) => s + o.total, 0)),
  }), [counts]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.FlatList
        testID="orders-screen"
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: 120 + insets.bottom }}
        data={data}
        keyExtractor={(o) => o.id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <>
            <ScreenTitle
              testID="orders-title"
              right={
                <View style={styles.headerActions}>
                  <TouchableOpacity style={styles.iconBtn} testID="orders-search"><Feather name="search" size={18} color={colors.foreground} /></TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} testID="orders-filter"><Feather name="sliders" size={18} color={colors.foreground} /></TouchableOpacity>
                </View>
              }
            >
              Orders
            </ScreenTitle>
            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Dinner service · live</Text>
            </View>

            {/* Summary cards — fixed 4-up row, no horizontal scroll */}
            <View style={styles.summaryRow}>
              <SummaryCard colors={colors} styles={styles} color={staticColors.info}    label="Active"   value={String(summary.active)} />
              <SummaryCard colors={colors} styles={styles} color={staticColors.warning} label="Pending"  value={String(summary.pending)} />
              <SummaryCard colors={colors} styles={styles} color={staticColors.purple}  label="Avg Prep" value={summary.avgPrep} />
              <SummaryCard colors={colors} styles={styles} color={staticColors.success} label="Revenue"  value={summary.revenue} />
            </View>

            {/* Status chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    testID={`orders-filter-${f.key}`}
                    onPress={() => setFilter(f.key)}
                    activeOpacity={0.8}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: f.color }]} />
                    <Text style={[styles.chipLabel, active && { color: colors.foreground }]}>{f.label}</Text>
                    <View style={styles.chipCount}>
                      <Text style={styles.chipCountText}>{counts[f.key]}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        }
        renderItem={({ item }) => <OrderCard order={item} colors={colors} styles={styles} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={28} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>No orders in this view</Text>
          </View>
        }
      />

      {/* Floating create-order button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 90 + insets.bottom }]}
        onPress={() => router.push('/add-order')}
        activeOpacity={0.85}
        testID="orders-add-fab"
        accessibilityLabel="Create manual order"
        accessibilityRole="button"
      >
        <Feather name="file-plus" size={24} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

type StylesType = ReturnType<typeof makeStyles>;

function SummaryCard({ label, value, color, styles }: { label: string; value: string; color: string; colors: ThemePalette; styles: StylesType }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryAccent, { backgroundColor: color }]} />
      <Text style={styles.summaryLabel} numberOfLines={1}>{label.toUpperCase()}</Text>
      <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text>
    </View>
  );
}

function OrderCard({ order, colors, styles }: { order: Order; colors: ThemePalette; styles: StylesType }) {
  const s = STATUS_STYLE[order.status];
  return (
    <Card style={styles.orderCard} testID={`order-item-${order.id}`}>
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.orderNumber}>{order.number}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.orderTime}>{order.received}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Feather name={TYPE_ICON[order.type]} size={12} color={colors.mutedForeground} />
          <Text style={styles.metaText}>
            {order.type === 'dine-in' ? `Dine-in · ${order.table}` : order.type[0].toUpperCase() + order.type.slice(1)}
          </Text>
        </View>
        <Text style={styles.customer}>{order.customer}</Text>
      </View>

      <View style={styles.divider} />

      <View style={{ gap: 6 }}>
        {order.items.map((it, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemQty}>{it.qty}x</Text>
            <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
            <Text style={styles.itemPrice}>{fmt(it.price)}</Text>
          </View>
        ))}
      </View>

      {order.note && (
        <View style={styles.noteBox}>
          <Feather name="alert-circle" size={12} color={staticColors.warning} />
          <Text style={styles.noteText}>{order.note}</Text>
        </View>
      )}

      <View style={styles.divider} />
      <View style={styles.footerRow}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.totalValue}>{fmt(order.total)}</Text>
            <View style={[styles.payPill, {
              backgroundColor: order.payment === 'paid' ? '#22C55E22' : '#F59E0B22',
            }]}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: order.payment === 'paid' ? '#4ADE80' : '#F59E0B' }}>
                {order.payment === 'paid' ? 'Paid' : 'Unpaid'}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {order.status === 'new' && (
            <>
              <TouchableOpacity style={styles.ghostBtn} testID={`order-reject-${order.id}`} activeOpacity={0.7}>
                <Text style={styles.ghostBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} testID={`order-accept-${order.id}`} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Accept</Text>
              </TouchableOpacity>
            </>
          )}
          {order.status === 'confirmed' && (
            <TouchableOpacity style={styles.primaryBtn} testID={`order-start-${order.id}`} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Start</Text>
            </TouchableOpacity>
          )}
          {order.status === 'preparing' && (
            <TouchableOpacity style={styles.primaryBtn} testID={`order-ready-${order.id}`} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Mark ready</Text>
            </TouchableOpacity>
          )}
          {order.status === 'ready' && (
            <TouchableOpacity style={styles.primaryBtn} testID={`order-complete-${order.id}`} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Complete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}
