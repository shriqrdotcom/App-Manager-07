import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '@/src/constants/colors';
import { ScreenTitle, Card } from '@/src/components/ui';

type BStatus = 'pending' | 'confirmed' | 'arrived' | 'seated' | 'completed';
type Booking = {
  id: string;
  name: string; time: string; guests: number;
  seat: string; phone: string;
  status: BStatus; note?: string; date: string;
};

const BOOKINGS: Booking[] = [
  { id: '1', name: 'Farah Sheikh', time: '19:30', guests: 4, seat: 'T-04', phone: '+91 90101 30022', status: 'completed', note: 'Anniversary', date: '22' },
  { id: '2', name: 'Manish Aggarwal', time: '20:00', guests: 2, seat: 'T-11', phone: '+91 98220 90011', status: 'arrived', date: '22' },
  { id: '3', name: 'Ishaan Verma', time: '20:15', guests: 4, seat: 'T-06', phone: '+91 96500 12345', status: 'confirmed', note: 'Vegetarian menu', date: '22' },
  { id: '4', name: 'Neha Rao', time: '21:00', guests: 6, seat: 'T-02', phone: '+91 90211 55432', status: 'pending', date: '22' },
  { id: '5', name: 'Karan Malik', time: '13:00', guests: 3, seat: 'T-08', phone: '+91 92345 67890', status: 'confirmed', date: '23' },
];

const DATES = [
  { label: 'TODAY', num: '22', count: 4 },
  { label: 'TOMORROW', num: '23', count: 1 },
  { label: 'THU', num: '24', count: 3 },
  { label: 'FRI', num: '25', count: 2 },
  { label: 'SAT', num: '26', count: 5 },
  { label: 'SUN', num: '27', count: 2 },
];

const STATUS_STYLE: Record<BStatus, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#F59E0B22', color: '#F59E0B', label: 'Pending' },
  confirmed: { bg: '#3B82F622', color: '#60A5FA', label: 'Confirmed' },
  arrived:   { bg: '#8B5CF622', color: '#A78BFA', label: 'Arrived' },
  seated:    { bg: '#22C55E22', color: '#4ADE80', label: 'Seated' },
  completed: { bg: '#22C55E22', color: '#4ADE80', label: 'Completed' },
};

export default function Booking() {
  const [tab, setTab] = useState<'tables' | 'rooms'>('tables');
  const [dateNum, setDateNum] = useState('22');
  const [toast, setToast] = useState<string | null>(null);

  const data = useMemo(() => BOOKINGS.filter((b) => b.date === dateNum), [dateNum]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        testID="booking-screen"
        data={data}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ paddingBottom: 24 }}
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

            {/* Tabs */}
            <View style={styles.tabsWrap}>
              <View style={styles.tabsRow}>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'tables' && styles.tabBtnActive]}
                  onPress={() => setTab('tables')}
                  testID="booking-tab-tables"
                >
                  <Feather name="grid" size={14} color={tab === 'tables' ? colors.background : colors.mutedForeground} />
                  <Text style={[styles.tabText, tab === 'tables' && { color: colors.background }]}>Table bookings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabBtn, tab === 'rooms' && styles.tabBtnActive]}
                  onPress={() => setTab('rooms')}
                  testID="booking-tab-rooms"
                >
                  <Feather name="home" size={14} color={tab === 'rooms' ? colors.background : colors.mutedForeground} />
                  <Text style={[styles.tabText, tab === 'rooms' && { color: colors.background }]}>Private rooms</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date strip */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
              {DATES.map((d) => {
                const active = d.num === dateNum;
                return (
                  <TouchableOpacity
                    key={d.num}
                    onPress={() => setDateNum(d.num)}
                    testID={`booking-date-${d.num}`}
                    style={[styles.dateChip, active && styles.dateChipActive]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.dateLabel, active && { color: colors.background }]}>{d.label}</Text>
                    <Text style={[styles.dateNum, active && { color: colors.background }]}>{d.num}</Text>
                    <View style={[styles.dateCountPill, active && { backgroundColor: '#00000022' }]}>
                      <Text style={[styles.dateCount, active && { color: colors.background }]}>{d.count}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        }
        renderItem={({ item }) => <BookingCard b={item} onAction={showToast} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="calendar" size={28} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>No bookings for this date</Text>
          </View>
        }
      />

      {toast && (
        <View style={styles.toast} testID="booking-toast">
          <Feather name="check-circle" size={14} color={colors.success} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

function BookingCard({ b, onAction }: { b: Booking; onAction: (msg: string) => void }) {
  const s = STATUS_STYLE[b.status];
  const initials = b.name.split(' ').slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');

  const primaryAction = () => {
    if (b.status === 'pending') return { label: 'Confirm', onPress: () => onAction(`${b.name} confirmed`) };
    if (b.status === 'confirmed') return { label: 'Mark arrived', onPress: () => onAction(`${b.name} → arrived`) };
    if (b.status === 'arrived') return { label: 'Seat guest', onPress: () => onAction(`${b.name} seated`) };
    if (b.status === 'seated') return { label: 'Complete', onPress: () => onAction(`${b.name} → completed`) };
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
            <Text style={styles.bookingName} numberOfLines={1}>{b.name}</Text>
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
        <Text style={styles.phoneText}>{b.phone}</Text>
        <TouchableOpacity style={styles.callBtn} testID={`booking-call-${b.id}`} onPress={() => onAction(`Calling ${b.name}…`)}>
          <Text style={styles.callBtnText}>Call</Text>
        </TouchableOpacity>
      </View>

      {b.note && (
        <View style={styles.noteBox}>
          <Feather name="star" size={11} color={colors.warning} />
          <Text style={styles.noteText}>{b.note}</Text>
        </View>
      )}

      {pa && (
        <TouchableOpacity style={styles.wideBtn} onPress={pa.onPress} activeOpacity={0.85} testID={`booking-primary-${b.id}`}>
          <Text style={styles.wideBtnText}>{pa.label}</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#1B1C1C',
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  tabsWrap: { paddingHorizontal: 20, marginBottom: 14 },
  tabsRow: {
    flexDirection: 'row', backgroundColor: '#1B1C1C',
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 8,
  },
  tabBtnActive: { backgroundColor: colors.foreground },
  tabText: { color: colors.mutedForeground, fontSize: 13, fontWeight: '600' },

  dateRow: { paddingHorizontal: 20, gap: 10, paddingBottom: 14 },
  dateChip: {
    width: 68, alignItems: 'center', paddingVertical: 10,
    backgroundColor: '#1B1C1C', borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, gap: 4, flexShrink: 0,
  },
  dateChipActive: { backgroundColor: colors.foreground, borderColor: colors.foreground },
  dateLabel: { fontSize: 9, fontWeight: '700', color: colors.mutedForeground, letterSpacing: 0.6 },
  dateNum: { fontSize: 20, fontWeight: '800', color: colors.foreground },
  dateCountPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: '#2A2B2C' },
  dateCount: { fontSize: 10, fontWeight: '700', color: colors.foreground },

  bookingCard: { marginHorizontal: 20, gap: 12, padding: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#2A2B2C',
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

  wideBtn: { backgroundColor: colors.foreground, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  wideBtnText: { color: colors.background, fontWeight: '700', fontSize: 13 },

  empty: { alignItems: 'center', gap: 8, paddingTop: 32 },
  emptyText: { color: colors.mutedForeground, fontSize: 13 },

  toast: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#26272A', borderWidth: 1, borderColor: colors.border,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10,
  },
  toastText: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
});
