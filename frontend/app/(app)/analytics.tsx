import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated';
import { useScrollHeader } from '@/src/providers/ScrollHeaderProvider';

const TAB_INDEX = 3;
import { Feather } from '@expo/vector-icons';
import { useTheme, type ThemePalette } from '@/src/providers/ThemeProvider';
import { ScreenTitle, Card } from '@/src/components/ui';

type Range = 'today' | '7d' | '30d' | 'custom';

const DATA = {
  today: { revenue: 18420, orders: 84, bookings: 12, aov: 219, rDelta: 12, oDelta: 8, bDelta: 2, aDelta: 4 },
  '7d':  { revenue: 128340, orders: 612, bookings: 96, aov: 209, rDelta: 18, oDelta: 11, bDelta: 7, aDelta: 6 },
  '30d': { revenue: 512890, orders: 2431, bookings: 384, aov: 211, rDelta: 22, oDelta: 15, bDelta: 12, aDelta: 8 },
  custom:{ revenue: 84000, orders: 411, bookings: 62, aov: 204, rDelta: 9, oDelta: 6, bDelta: 4, aDelta: 3 },
};

const REVENUE_BARS = [58, 72, 65, 88, 96, 112, 98];
const HOURLY = [8, 12, 18, 22, 28, 35, 42, 48, 40, 32, 26, 18];
const BOOKING_LINE = [12, 15, 14, 18, 22, 26, 24];
const SOURCE = [
  { label: 'Dine-in',  value: 46, color: '#F5F5F5' },
  { label: 'Delivery', value: 34, color: '#60A5FA' },
  { label: 'Takeaway', value: 20, color: '#A78BFA' },
];

function makeStyles(colors: ThemePalette) {
  return StyleSheet.create({
    rangeRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 14, alignItems: 'center' },
    rangeChip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexShrink: 0,
    },
    rangeText: { color: colors.mutedForeground, fontSize: 12.5, fontWeight: '600' },

    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 14 },
    kpiCard: {
      flexBasis: '48%', flexGrow: 1,
      backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
      padding: 14, gap: 8,
    },
    kpiHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    kpiIcon: {
      width: 30, height: 30, borderRadius: 8, backgroundColor: colors.muted,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
    },
    deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999 },
    kpiValue: { color: colors.foreground, fontSize: 20, fontWeight: '800', marginTop: 4 },
    kpiLabel: { color: colors.mutedForeground, fontSize: 12 },

    chartCard: { marginHorizontal: 20, marginBottom: 12, padding: 16 },
    chartHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
    chartTitle: { color: colors.foreground, fontSize: 14, fontWeight: '700' },
    chartSub: { color: colors.mutedForeground, fontSize: 11 },
    chart: {
      flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
      height: 140, paddingTop: 8,
    },
    barCol: { flex: 1, alignItems: 'center', gap: 6 },
    bar: { width: 18, backgroundColor: colors.foreground, borderRadius: 6 },
    barLabel: { fontSize: 10, color: colors.mutedForeground, fontWeight: '600' },
    barColThin: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
    barThin: { width: 6, backgroundColor: '#60A5FA', borderRadius: 3 },
    hourAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 4 },
    hourText: { color: colors.mutedForeground, fontSize: 10 },

    dotCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#A78BFA', borderWidth: 2, borderColor: colors.card },

    stacked: { flexDirection: 'row', height: 14, borderRadius: 6, overflow: 'hidden', marginTop: 8 },
    legendRow: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', marginTop: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { color: colors.mutedForeground, fontSize: 12 },
    legendValue: { color: colors.foreground, fontSize: 12, fontWeight: '700' },
  });
}

type StylesType = ReturnType<typeof makeStyles>;

export default function Analytics() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [range, setRange] = useState<Range>('7d');
  const d = DATA[range];

  const maxRev = useMemo(() => Math.max(...REVENUE_BARS), []);
  const maxHr  = useMemo(() => Math.max(...HOURLY), []);
  const maxBk  = useMemo(() => Math.max(...BOOKING_LINE), []);

  const { scrollY, reportTabScroll } = useScrollHeader();
  const updatePos = useCallback((y: number) => { reportTabScroll(TAB_INDEX, y); }, [reportTabScroll]);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
    runOnJS(updatePos)(e.contentOffset.y);
  });

  return (
    <Animated.ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: 24 }}
      testID="analytics-screen"
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      <ScreenTitle testID="analytics-title">Analytics</ScreenTitle>

      {/* Range filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangeRow}>
        {(['today', '7d', '30d', 'custom'] as Range[]).map((r) => {
          const active = r === range;
          const label = r === 'today' ? 'Today' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'Custom';
          return (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              testID={`analytics-range-${r}`}
              style={[styles.rangeChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.rangeText, active && { color: colors.primaryForeground }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* KPI grid */}
      <View style={styles.kpiGrid}>
        <Kpi colors={colors} styles={styles} label="Total revenue" value={`₹${d.revenue.toLocaleString('en-IN')}`} delta={d.rDelta} icon="dollar-sign" testID="kpi-revenue" />
        <Kpi colors={colors} styles={styles} label="Total orders"  value={d.orders.toLocaleString('en-IN')}       delta={d.oDelta} icon="shopping-bag" testID="kpi-orders" />
        <Kpi colors={colors} styles={styles} label="Bookings"      value={d.bookings.toLocaleString('en-IN')}     delta={d.bDelta} icon="calendar" testID="kpi-bookings" />
        <Kpi colors={colors} styles={styles} label="Avg order value" value={`₹${d.aov}`}                          delta={d.aDelta} icon="trending-up" testID="kpi-aov" />
      </View>

      {/* Revenue trend */}
      <Card style={styles.chartCard} testID="chart-revenue">
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Revenue trend</Text>
          <Text style={styles.chartSub}>Last 7 days</Text>
        </View>
        <View style={styles.chart}>
          {REVENUE_BARS.map((v, i) => (
            <View key={i} style={styles.barCol}>
              <View style={[styles.bar, { height: (v / maxRev) * 120 }]} />
              <Text style={styles.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Orders by hour */}
      <Card style={styles.chartCard} testID="chart-hourly">
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Orders by hour</Text>
          <Text style={styles.chartSub}>Peak · 7-8 PM</Text>
        </View>
        <View style={styles.chart}>
          {HOURLY.map((v, i) => (
            <View key={i} style={styles.barColThin}>
              <View style={[styles.barThin, { height: (v / maxHr) * 100 }]} />
            </View>
          ))}
        </View>
        <View style={styles.hourAxis}>
          <Text style={styles.hourText}>10a</Text>
          <Text style={styles.hourText}>2p</Text>
          <Text style={styles.hourText}>6p</Text>
          <Text style={styles.hourText}>10p</Text>
        </View>
      </Card>

      {/* Booking trend (line-like) */}
      <Card style={styles.chartCard} testID="chart-bookings">
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Booking trend</Text>
          <Text style={styles.chartSub}>Last 7 days</Text>
        </View>
        <View style={styles.chart}>
          {BOOKING_LINE.map((v, i) => (
            <View key={i} style={styles.dotCol}>
              <View style={{ height: (v / maxBk) * 100 + 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                <View style={styles.dot} />
              </View>
              <Text style={styles.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Source split */}
      <Card style={styles.chartCard} testID="chart-source">
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Order source</Text>
          <Text style={styles.chartSub}>Share of orders</Text>
        </View>
        <View style={styles.stacked}>
          {SOURCE.map((s, i) => (
            <View
              key={s.label}
              style={{
                flex: s.value,
                backgroundColor: s.color,
                borderTopLeftRadius: i === 0 ? 6 : 0,
                borderBottomLeftRadius: i === 0 ? 6 : 0,
                borderTopRightRadius: i === SOURCE.length - 1 ? 6 : 0,
                borderBottomRightRadius: i === SOURCE.length - 1 ? 6 : 0,
              }}
            />
          ))}
        </View>
        <View style={styles.legendRow}>
          {SOURCE.map((s) => (
            <View key={s.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendText}>{s.label}</Text>
              <Text style={styles.legendValue}>{s.value}%</Text>
            </View>
          ))}
        </View>
      </Card>
    </Animated.ScrollView>
  );
}

function Kpi({ label, value, delta, icon, testID, colors, styles }: { label: string; value: string; delta: number; icon: keyof typeof Feather.glyphMap; testID?: string; colors: ThemePalette; styles: StylesType }) {
  const up = delta >= 0;
  return (
    <View style={styles.kpiCard} testID={testID}>
      <View style={styles.kpiHead}>
        <View style={styles.kpiIcon}><Feather name={icon} size={14} color={colors.mutedForeground} /></View>
        <View style={[styles.deltaPill, { backgroundColor: up ? '#22C55E22' : '#EF444422' }]}>
          <Feather name={up ? 'trending-up' : 'trending-down'} size={10} color={up ? '#4ADE80' : '#F87171'} />
          <Text style={{ fontSize: 10, fontWeight: '700', color: up ? '#4ADE80' : '#F87171' }}>{up ? '+' : ''}{delta}%</Text>
        </View>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}
