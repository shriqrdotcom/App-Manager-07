import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import { useTheme, type ThemePalette } from '@/src/providers/ThemeProvider';
import staticColors from '@/src/constants/colors';
import { ScreenTitle, Card } from '@/src/components/ui';
import { api, Booking, BookingStatus } from '@/src/api/client';
import { useApp } from '@/src/providers/AppProvider';

const STATUS_STYLE: Record<BookingStatus, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#F59E0B22', color: '#F59E0B', label: 'Pending' },
  confirmed: { bg: '#3B82F622', color: '#60A5FA', label: 'Confirmed' },
  arrived:   { bg: '#8B5CF622', color: '#A78BFA', label: 'Arrived' },
  seated:    { bg: '#22C55E22', color: '#4ADE80', label: 'Seated' },
  completed: { bg: '#22C55E22', color: '#4ADE80', label: 'Completed' },
};

// Build a 7-day window centred on today
function buildDates() {
  const today = dayjs();
  return Array.from({ length: 7 }).map((_, i) => {
    const d = today.add(i, 'day');
    return {
      iso: d.format('YYYY-MM-DD'),
      num: d.format('DD'),
      label: i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' : d.format('ddd').toUpperCase(),
    };
  });
}

function makeStyles(colors: ThemePalette) {
  return StyleSheet.create({
    iconBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    },
    tabsWrap: { paddingHorizontal: 20, marginBottom: 14 },
    tabsRow: {
      flexDirection: 'row', backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 4,
    },
    tabBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 10, borderRadius: 8,
    },
    tabBtnActive: { backgroundColor: colors.primary },
    tabText: { color: colors.mutedForeground, fontSize: 13, fontWeight: '600' },

    dateRow: { paddingHorizontal: 20, gap: 10, paddingBottom: 14 },
    dateChip: {
      width: 76, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, gap: 4, flexShrink: 0,
    },
    dateChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    dateLabel: { fontSize: 9, fontWeight: '700', color: colors.mutedForeground, letterSpacing: 0.6 },
    dateNum: { fontSize: 20, fontWeight: '800', color: colors.foreground },
    dateCountPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: colors.accent },
    dateCount: { fontSize: 10, fontWeight: '700', color: colors.foreground },

    bookingCard: { marginHorizontal: 20, gap: 12, padding: 16 },
    rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
    avatar: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: colors.foreground, fontWeight: '700', fontSize: 13 },
    bookingName: { color: colors.foreground, fontSize: 15, fontWeight: '700' },
    metaLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
    metaText: { color: colors.mutedForeground, fontSize: 12 },
    metaSep: { color: colors.mutedForeground, fontSize: 12, marginHorizontal: 2 },
    statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    phoneText: { color: colors.mutedForeground, fontSize: 12.5, flex: 1 },
    callBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
    callBtnText: { color: colors.foreground, fontSize: 12, fontWeight: '600' },

    noteBox: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: '#F59E0B10', borderWidth: 1, borderColor: '#F59E0B33',
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    },
    noteText: { color: '#F5C577', fontSize: 12, flex: 1 },

    wideBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
    wideBtnText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 13 },

    center: { paddingTop: 48, alignItems: 'center' },
    empty: { alignItems: 'center', gap: 10, paddingTop: 40, paddingHorizontal: 20 },
    emptyText: { color: colors.mutedForeground, fontSize: 13, textAlign: 'center' },
    emptyBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
      backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
    },
    emptyBtnText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 13 },

    errorBar: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      marginHorizontal: 20, marginBottom: 8,
      backgroundColor: '#3B1D1D', borderWidth: 1, borderColor: '#7F1D1D',
      borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    },
    errorText: { color: '#F87171', fontSize: 12.5, flex: 1 },
    retry: { color: colors.foreground, fontSize: 12.5, fontWeight: '700', textDecorationLine: 'underline' },

    fab: {
      position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 16,
      backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },

    toast: {
      position: 'absolute', alignSelf: 'center',
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10,
    },
    toastText: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
  });
}

type StylesType = ReturnType<typeof makeStyles>;

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const { selectedRestaurant } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState<'tables' | 'rooms'>('tables');
  const [dateIso, setDateIso] = useState(dayjs().format('YYYY-MM-DD'));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dates = useMemo(buildDates, []);

  const fetchBookings = useCallback(async () => {
    if (!selectedRestaurant) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.listBookings(selectedRestaurant.id, dateIso);
      setBookings(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [selectedRestaurant, dateIso]);

  // Refetch whenever screen gains focus or date/restaurant changes
  useFocusEffect(useCallback(() => { void fetchBookings(); }, [fetchBookings]));

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    dates.forEach((d) => { c[d.iso] = 0; });
    bookings.forEach((b) => { if (b.date in c) c[b.date]++; });
    return c;
  }, [bookings, dates]);

  // For date strip counts we'd need all dates; keep single-date count on active
  const shown = useMemo(
    () => bookings.filter((b) => (tab === 'tables' ? b.booking_type === 'table' : b.booking_type === 'room')),
    [bookings, tab],
  );

  const openAddBooking = () => router.push('/add-booking');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        testID="booking-screen"
        data={shown}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        onRefresh={fetchBookings}
        refreshing={loading}
        ListHeaderComponent={
          <>
            <ScreenTitle
              testID="booking-title"
              right={
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.iconBtn} testID="booking-search"><Feather name="search" size={18} color={colors.foreground} /></TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} testID="booking-filter"><Feather name="sliders" size={18} color={colors.foreground} /></TouchableOpacity>
                </View>
              }
            >
              Bookings
            </ScreenTitle>

            <View style={styles.tabsWrap}>
              <View style={styles.tabsRow}>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'tables' && styles.tabBtnActive]}
                  onPress={() => setTab('tables')}
                  testID="booking-tab-tables"
                >
                  <Feather name="grid" size={14} color={tab === 'tables' ? colors.primaryForeground : colors.mutedForeground} />
                  <Text style={[styles.tabText, tab === 'tables' && { color: colors.primaryForeground }]}>Table bookings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'rooms' && styles.tabBtnActive]}
                  onPress={() => setTab('rooms')}
                  testID="booking-tab-rooms"
                >
                  <Feather name="home" size={14} color={tab === 'rooms' ? colors.primaryForeground : colors.mutedForeground} />
                  <Text style={[styles.tabText, tab === 'rooms' && { color: colors.primaryForeground }]}>Private rooms</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
              {dates.map((d) => {
                const active = d.iso === dateIso;
                return (
                  <TouchableOpacity
                    key={d.iso}
                    onPress={() => setDateIso(d.iso)}
                    testID={`booking-date-${d.num}`}
                    style={[styles.dateChip, active && styles.dateChipActive]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.dateLabel, active && { color: colors.primaryForeground }]} numberOfLines={1}>{d.label}</Text>
                    <Text style={[styles.dateNum, active && { color: colors.primaryForeground }]}>{d.num}</Text>
                    <View style={[styles.dateCountPill, active && { backgroundColor: '#00000022' }]}>
                      <Text style={[styles.dateCount, active && { color: colors.primaryForeground }]}>{counts[d.iso] ?? 0}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {error && (
              <View style={styles.errorBar} testID="booking-error">
                <Feather name="alert-circle" size={14} color={staticColors.destructive} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchBookings}><Text style={styles.retry}>Retry</Text></TouchableOpacity>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => <BookingCard b={item} onAction={showToast} colors={colors} styles={styles} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}><ActivityIndicator color={colors.foreground} /></View>
          ) : (
            <View style={styles.empty}>
              <Feather name="calendar" size={28} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>No {tab === 'tables' ? 'table' : 'private room'} bookings for this date</Text>
              <TouchableOpacity onPress={openAddBooking} activeOpacity={0.85} style={styles.emptyBtn} testID="booking-empty-add">
                <Feather name="plus" size={14} color={colors.primaryForeground} />
                <Text style={styles.emptyBtnText}>Add booking</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Floating add button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 90 + insets.bottom }]}
        onPress={openAddBooking}
        activeOpacity={0.85}
        testID="booking-add-fab"
        accessibilityLabel="Add booking"
        accessibilityRole="button"
      >
        <Feather name="plus" size={26} color={colors.primaryForeground} />
      </TouchableOpacity>

      {toast && (
        <View style={[styles.toast, { bottom: 160 + insets.bottom }]} testID="booking-toast">
          <Feather name="check-circle" size={14} color={staticColors.success} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

function BookingCard({ b, onAction, colors, styles }: { b: Booking; onAction: (msg: string) => void; colors: ThemePalette; styles: StylesType }) {
  const s = STATUS_STYLE[b.status];
  const initials = b.guest_name.split(' ').slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');

  const primaryAction = () => {
    if (b.status === 'pending')   return { label: 'Confirm',      msg: `${b.guest_name} confirmed` };
    if (b.status === 'confirmed') return { label: 'Mark arrived', msg: `${b.guest_name} → arrived` };
    if (b.status === 'arrived')   return { label: 'Seat guest',   msg: `${b.guest_name} seated` };
    if (b.status === 'seated')    return { label: 'Complete',     msg: `${b.guest_name} → completed` };
    return null;
  };
  const pa = primaryAction();

  return (
    <Card style={styles.bookingCard} testID={`booking-item-${b.id}`}>
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.bookingName} numberOfLines={1}>{b.guest_name}</Text>
            <View style={styles.metaLine}>
              <Feather name="clock" size={11} color={colors.mutedForeground} />
              <Text style={styles.metaText}>{b.time}</Text>
              <Text style={styles.metaSep}>·</Text>
              <Feather name="users" size={11} color={colors.mutedForeground} />
              <Text style={styles.metaText}>{b.guests} guests</Text>
              <Text style={styles.metaSep}>·</Text>
              <Text style={styles.metaText}>{b.seat}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
          <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      <View style={styles.phoneRow}>
        <Feather name="phone" size={12} color={colors.mutedForeground} />
        <Text style={styles.phoneText}>{b.phone_code} {b.phone}</Text>
        <TouchableOpacity style={styles.callBtn} testID={`booking-call-${b.id}`} onPress={() => onAction(`Calling ${b.guest_name}…`)}>
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>
      </View>

      {b.special_request && (
        <View style={styles.noteBox}>
          <Feather name="star" size={11} color={staticColors.warning} />
          <Text style={styles.noteText}>{b.special_request}</Text>
        </View>
      )}

      {pa && (
        <TouchableOpacity style={styles.wideBtn} onPress={() => onAction(pa.msg)} activeOpacity={0.85} testID={`booking-primary-${b.id}`}>
          <Text style={styles.wideBtnText}>{pa.label}</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}
