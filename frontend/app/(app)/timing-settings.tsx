import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useApp } from '@/src/providers/AppProvider';
import { storage } from '@/src/utils/storage';

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'timing_settings_v1';

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_SWIPE_DISTANCE = 40;
const DAY_SWIPE_VELOCITY = 450;
const DAY_SWIPE_MIN_DISTANCE = 18;

/** Today's day index: Mon=0 … Sun=6 */
function todayDayIdx(): number {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

function formatDate(): string {
  const now = new Date();
  const dayIdx = todayDayIdx();
  return `${DAYS_FULL[dayIdx]}, ${now.getDate()} ${MONTHS[now.getMonth()]}, ${now.getFullYear()}`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Types ────────────────────────────────────────────────────────────────────
type TimeSlot = {
  id: string;
  openH: number;   // 1–12
  openM: number;   // 0–59
  openAP: 'AM' | 'PM';
  closeH: number;
  closeM: number;
  closeAP: 'AM' | 'PM';
};

type DayState = {
  isOpen: boolean;
  slots: TimeSlot[];
};

type Schedule = DayState[];

function makeSlot(dayIdx: number, slotIdx: number): TimeSlot {
  return {
    id: `${dayIdx}-${slotIdx}-${Date.now()}`,
    openH: 11, openM: 0, openAP: 'AM',
    closeH: 11, closeM: 0, closeAP: 'PM',
  };
}

const DEFAULT_SCHEDULE: Schedule = DAYS_SHORT.map((_, i) => ({
  isOpen: i < 5,
  slots: [makeSlot(i, 0)],
}));

// ─── Animated Toggle ──────────────────────────────────────────────────────────
function Toggle({
  value,
  onValueChange,
  colors,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 220 });
  }, [progress, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.accent, '#22C55E'],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 22 }],
  }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={8}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

// ─── Fading digit ─────────────────────────────────────────────────────────────
function FadingText({
  value,
  style,
}: {
  value: string;
  style?: object;
}) {
  const [shown, setShown] = useState(value);
  const opacity = useSharedValue(1);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value === prevRef.current) return;
    prevRef.current = value;
    opacity.value = withTiming(0, { duration: 100 }, () => {
      runOnJS(setShown)(value);
      opacity.value = withTiming(1, { duration: 140 });
    });
  }, [value, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text style={[style, animStyle]}>
      {shown}
    </Animated.Text>
  );
}

// ─── Time stepper ─────────────────────────────────────────────────────────────
function TimeStepper({
  label,
  h,
  m,
  ap,
  onChange,
  colors,
}: {
  label: string;
  h: number;
  m: number;
  ap: 'AM' | 'PM';
  onChange: (h: number, m: number, ap: 'AM' | 'PM') => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');

  const stepH = (delta: number) => {
    let nh = h + delta;
    if (nh > 12) nh = 1;
    if (nh < 1) nh = 12;
    onChange(nh, m, ap);
  };

  const stepM = (delta: number) => {
    let nm = m + delta;
    if (nm >= 60) nm = 0;
    if (nm < 0) nm = 55;
    onChange(h, nm, ap);
  };

  const toggleAP = () => {
    onChange(h, m, ap === 'AM' ? 'PM' : 'AM');
  };

  const digitColor = colors.foreground;
  const mutedColor = colors.mutedForeground;

  return (
    <View style={styles.stepperCol}>
      <Text style={[styles.stepperLabel, { color: mutedColor }]}>{label}</Text>
      <View style={styles.stepperRow}>
        {/* Hour */}
        <View style={styles.stepperSegment}>
          <TouchableOpacity onPress={() => stepH(1)} hitSlop={6} style={styles.stepBtn}>
            <Feather name="chevron-up" size={14} color={mutedColor} />
          </TouchableOpacity>
          <FadingText value={hh} style={[styles.digitText, { color: digitColor }]} />
          <TouchableOpacity onPress={() => stepH(-1)} hitSlop={6} style={styles.stepBtn}>
            <Feather name="chevron-down" size={14} color={mutedColor} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.digitColon, { color: digitColor }]}>:</Text>

        {/* Minute */}
        <View style={styles.stepperSegment}>
          <TouchableOpacity onPress={() => stepM(5)} hitSlop={6} style={styles.stepBtn}>
            <Feather name="chevron-up" size={14} color={mutedColor} />
          </TouchableOpacity>
          <FadingText value={mm} style={[styles.digitText, { color: digitColor }]} />
          <TouchableOpacity onPress={() => stepM(-5)} hitSlop={6} style={styles.stepBtn}>
            <Feather name="chevron-down" size={14} color={mutedColor} />
          </TouchableOpacity>
        </View>

        {/* AM / PM */}
        <TouchableOpacity onPress={toggleAP} hitSlop={6} style={styles.apToggle}>
          <FadingText value={ap} style={[styles.apText, { color: '#22C55E' }]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Slot row ─────────────────────────────────────────────────────────────────
function SlotRow({
  slot,
  canDelete,
  onUpdate,
  onDelete,
  fadeKey,
  colors,
}: {
  slot: TimeSlot;
  canDelete: boolean;
  onUpdate: (s: TimeSlot) => void;
  onDelete: () => void;
  fadeKey: number;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const fadeProgress = useSharedValue(0);

  useEffect(() => {
    fadeProgress.value = 0;
    fadeProgress.value = withTiming(1, { duration: 180 });
  }, [fadeKey, fadeProgress]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeProgress.value,
    transform: [{ translateY: (1 - fadeProgress.value) * 5 }],
  }));

  return (
    <Animated.View
      style={[
        styles.slotRow,
        { backgroundColor: colors.muted, borderColor: colors.border },
        fadeStyle,
      ]}
    >
      <View style={styles.slotSteppers}>
        <TimeStepper
          label="Opens"
          h={slot.openH} m={slot.openM} ap={slot.openAP}
          onChange={(h, m, ap) => onUpdate({ ...slot, openH: h, openM: m, openAP: ap })}
          colors={colors}
        />
        <View style={styles.slotArrow}>
          <Feather name="arrow-right" size={16} color={colors.mutedForeground} />
        </View>
        <TimeStepper
          label="Closes"
          h={slot.closeH} m={slot.closeM} ap={slot.closeAP}
          onChange={(h, m, ap) => onUpdate({ ...slot, closeH: h, closeM: m, closeAP: ap })}
          colors={colors}
        />
      </View>
      {canDelete && (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={8}
          style={styles.slotDelete}
          accessibilityLabel="Remove time slot"
        >
          <Feather name="x" size={15} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ─── Day card ─────────────────────────────────────────────────────────────────
function DayCard({
  dayIdx,
  dayState,
  isToday,
  fadeKey,
  onDayChange,
  onSave,
  colors,
}: {
  dayIdx: number;
  dayState: DayState;
  isToday: boolean;
  fadeKey: number;
  onDayChange: (d: DayState) => void;
  onSave: (dayIdx: number) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const updateSlot = useCallback(
    (slotIdx: number, updated: TimeSlot) => {
      const slots = dayState.slots.map((s, i) => (i === slotIdx ? updated : s));
      onDayChange({ ...dayState, slots });
    },
    [dayState, onDayChange],
  );

  const deleteSlot = useCallback(
    (slotIdx: number) => {
      const slots = dayState.slots.filter((_, i) => i !== slotIdx);
      onDayChange({ ...dayState, slots });
    },
    [dayState, onDayChange],
  );

  const addSlot = useCallback(() => {
    const slots = [...dayState.slots, makeSlot(dayIdx, dayState.slots.length)];
    onDayChange({ ...dayState, slots });
  }, [dayIdx, dayState, onDayChange]);

  return (
    <View style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Day header */}
      <View style={styles.dayHeader}>
        <View style={styles.dayHeaderLeft}>
          <Text style={[styles.dayName, { color: colors.foreground }]}>
            {DAYS_FULL[dayIdx]}
          </Text>
          {isToday && (
            <View style={[styles.todayPill, { backgroundColor: '#22C55E22' }]}>
              <Text style={[styles.todayPillText, { color: '#22C55E' }]}>Today</Text>
            </View>
          )}
        </View>
        <Toggle
          value={dayState.isOpen}
          onValueChange={(v) => onDayChange({ ...dayState, isOpen: v })}
          colors={colors}
        />
      </View>

      {/* Slots */}
      {dayState.isOpen ? (
        <>
          {dayState.slots.map((slot, idx) => (
            <SlotRow
              key={slot.id}
              slot={slot}
              canDelete={dayState.slots.length > 1}
              onUpdate={(updated) => updateSlot(idx, updated)}
              onDelete={() => deleteSlot(idx)}
              fadeKey={fadeKey}
              colors={colors}
            />
          ))}

          {/* Add slot + Save row */}
          <View style={styles.cardFooter}>
            {dayState.slots.length < 3 ? (
              <TouchableOpacity
                onPress={addSlot}
                hitSlop={6}
                style={[styles.addSlotBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
                accessibilityLabel="Add another time slot"
              >
                <Feather name="plus" size={14} color={colors.mutedForeground} />
                <Text style={[styles.addSlotText, { color: colors.mutedForeground }]}>Add slot</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <TouchableOpacity
              onPress={() => onSave(dayIdx)}
              style={[styles.saveBtn, { backgroundColor: '#22C55E' }]}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.closedRow}>
          <Feather name="moon" size={14} color={colors.mutedForeground} />
          <Text style={[styles.closedText, { color: colors.mutedForeground }]}>Closed this day</Text>
          <TouchableOpacity
            onPress={() => onSave(dayIdx)}
            style={[styles.saveBtnSmall, { backgroundColor: colors.accent, borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveBtnSmallText, { color: colors.mutedForeground }]}>Save</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function TimingSettings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { selectedRestaurant } = useApp();

  const restaurantName = selectedRestaurant?.name ?? 'Restaurant';
  const restaurantInitials = initials(restaurantName);
  const dateStr = formatDate();
  const todayIdx = todayDayIdx();

  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [loaded, setLoaded] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(todayIdx);
  const selectedDayRef = useRef(todayIdx);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingDayIdx, setPendingDayIdx] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Load persisted schedule
  useEffect(() => {
    (async () => {
      const saved = await storage.getItem(STORAGE_KEY, null as unknown as Schedule);
      if (saved && saved.length === 7) {
        setSchedule(saved);
      }
      setLoaded(true);
    })();
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const handleDayChange = useCallback((dayIdx: number, updated: DayState) => {
    setSchedule((prev) => prev.map((d, i) => (i === dayIdx ? updated : d)));
  }, []);

  const changeDayBySwipe = useCallback((direction: 1 | -1) => {
    const current = selectedDayRef.current;
    const next = Math.max(0, Math.min(DAYS_SHORT.length - 1, current + direction));

    if (next === current) return;

    selectedDayRef.current = next;
    setSelectedDayIdx(next);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const selectDay = useCallback((dayIdx: number) => {
    selectedDayRef.current = dayIdx;
    setSelectedDayIdx(dayIdx);
  }, []);

  const daySwipeGesture = Gesture.Pan()
    // The gesture is attached to the full screen, but only activates after
    // clear horizontal movement so buttons and vertical scrolling keep working.
    .activeOffsetX([-24, 24])
    .failOffsetY([-18, 18])
    .maxPointers(1)
    .onEnd((event) => {
      const hasClearDistance = Math.abs(event.translationX) >= DAY_SWIPE_DISTANCE;
      const hasClearVelocity =
        Math.abs(event.velocityX) >= DAY_SWIPE_VELOCITY &&
        Math.abs(event.translationX) >= DAY_SWIPE_MIN_DISTANCE;

      if (hasClearDistance || hasClearVelocity) {
        // Per the requested interaction: right advances, left goes back.
        runOnJS(changeDayBySwipe)(event.translationX > 0 ? 1 : -1);
      }
    });

  // Tap Save on a day card → show apply-to-all modal
  const handleSave = useCallback((dayIdx: number) => {
    setPendingDayIdx(dayIdx);
    setModalVisible(true);
  }, []);

  // Confirm: save only this day
  const confirmSaveOne = useCallback(async () => {
    setModalVisible(false);
    await storage.setItem(STORAGE_KEY, schedule);
    showToast(`${DAYS_FULL[pendingDayIdx!]} saved`);
    setPendingDayIdx(null);
  }, [schedule, pendingDayIdx, showToast]);

  // Confirm: apply this day's schedule to all days then save
  const confirmSaveAll = useCallback(async () => {
    if (pendingDayIdx === null) return;
    const source = schedule[pendingDayIdx]!;
    const applied: Schedule = schedule.map((d, i) => {
      if (i === pendingDayIdx) return d;
      // Preserve each day's isOpen; copy the slot times
      return {
        isOpen: d.isOpen,
        slots: source.slots.map((s, si) => ({
          ...s,
          id: `${i}-${si}-${Date.now()}`,
        })),
      };
    });
    setSchedule(applied);
    setModalVisible(false);
    await storage.setItem(STORAGE_KEY, applied);
    showToast('Applied to all days');
    setPendingDayIdx(null);
  }, [schedule, pendingDayIdx, showToast]);

  if (!loaded) return null;

  return (
    <GestureDetector gesture={daySwipeGesture}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Fixed header ── */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        {/* Top row: back + title */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Timing</Text>
          {/* Logo circle */}
          <View style={[styles.logoCircle, { backgroundColor: colors.accent, borderColor: colors.border }]}>
            <Text style={[styles.logoText, { color: colors.foreground }]}>{restaurantInitials}</Text>
          </View>
        </View>

        {/* Restaurant name + date */}
        <View style={styles.headerMeta}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.restaurantName, { color: colors.foreground }]}>{restaurantName}</Text>
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{dateStr}</Text>
          </View>
        </View>

        {/* Day strip */}
        <View style={styles.dayStrip}>
          {DAYS_SHORT.map((d, i) => {
            const isSelected = i === selectedDayIdx;
            return (
              <Pressable
                key={d}
                onPress={() => selectDay(i)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Show ${DAYS_FULL[i]} timing`}
                style={[
                  styles.dayPill,
                  isSelected && { backgroundColor: '#22C55E' },
                ]}
              >
                <Text
                  style={[
                    styles.dayPillText,
                    { color: isSelected ? '#fff' : colors.mutedForeground },
                    isSelected && { fontWeight: '700' },
                  ]}
                >
                  {d}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Scrollable day cards ── */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <DayCard
          key={selectedDayIdx}
          dayIdx={selectedDayIdx}
          dayState={schedule[selectedDayIdx]!}
          isToday={selectedDayIdx === todayIdx}
          fadeKey={selectedDayIdx}
          onDayChange={(d) => handleDayChange(selectedDayIdx, d)}
          onSave={handleSave}
          colors={colors}
        />
      </ScrollView>

      {/* ── Toast ── */}
      {toast !== null && (
        <View style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="check-circle" size={15} color="#22C55E" />
          <Text style={[styles.toastText, { color: colors.foreground }]}>{toast}</Text>
        </View>
      )}

      {/* ── Apply-to-all modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Save timing</Text>
            {pendingDayIdx !== null && (
              <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                Saving changes for{' '}
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                  {DAYS_FULL[pendingDayIdx]}
                </Text>
              </Text>
            )}

            <TouchableOpacity
              style={[styles.sheetBtn, { backgroundColor: '#22C55E' }]}
              onPress={confirmSaveOne}
              activeOpacity={0.8}
            >
              <Text style={[styles.sheetBtnText, { color: '#fff' }]}>
                Save {pendingDayIdx !== null ? DAYS_FULL[pendingDayIdx] : 'day'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetBtn, styles.sheetBtnOutline, { borderColor: colors.border, backgroundColor: colors.muted }]}
              onPress={confirmSaveAll}
              activeOpacity={0.8}
            >
              <Feather name="copy" size={15} color={colors.foreground} style={{ marginRight: 8 }} />
              <Text style={[styles.sheetBtnText, { color: colors.foreground }]}>Apply to all days</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.sheetCancel}
              hitSlop={8}
            >
              <Text style={[styles.sheetCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      </View>
    </GestureDetector>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600' },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  restaurantName: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  dateText: { fontSize: 13, marginTop: 2 },

  dayStrip: {
    paddingHorizontal: 14,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dayPillText: {
    fontSize: 12.5,
    fontWeight: '500',
  },

  // Scroll content
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 14,
    gap: 12,
  },

  // Day card
  dayCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayName: { fontSize: 15.5, fontWeight: '600' },
  todayPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayPillText: { fontSize: 11, fontWeight: '600' },

  // Toggle
  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F5F5F5',
  },

  // Slot row
  slotRow: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slotSteppers: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotArrow: {
    paddingTop: 18, // align with digit row (below label)
  },
  slotDelete: { padding: 6, marginLeft: 4 },

  // Stepper
  stepperCol: { flex: 1 },
  stepperLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  stepperSegment: {
    alignItems: 'center',
    gap: 1,
  },
  stepBtn: { padding: 3 },
  digitText: {
    fontSize: 22,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
    lineHeight: 28,
  },
  digitColon: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
    paddingHorizontal: 1,
  },
  apToggle: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginLeft: 2,
    marginBottom: 2,
  },
  apText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Card footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 14,
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addSlotText: { fontSize: 12.5, fontWeight: '500' },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 9,
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 13.5 },
  saveBtnSmall: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  saveBtnSmallText: { fontSize: 12.5, fontWeight: '500' },

  // Closed row
  closedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  closedText: { flex: 1, fontSize: 13 },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  toastText: { fontSize: 13.5, fontWeight: '500' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  sheetSub: {
    fontSize: 13.5,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  sheetBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  sheetBtnOutline: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetBtnText: { fontSize: 15, fontWeight: '600' },
  sheetCancel: { marginTop: 6, paddingVertical: 8 },
  sheetCancelText: { fontSize: 14 },
});
