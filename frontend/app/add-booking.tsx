import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import { api, BookingSource, BookingType } from '@/src/api/client';
import { useApp } from '@/src/providers/AppProvider';
import { useTheme } from '@/src/providers/ThemeProvider';

// ---- Domain data ----
type Seating = { area: string; kind: BookingType; options: string[] };

const SEATING_LAYOUT: Seating[] = [
  { area: 'Main hall', kind: 'table', options: ['T-01', 'T-02', 'T-03', 'T-04', 'T-05', 'T-06', 'T-07', 'T-08'] },
  { area: 'Terrace',   kind: 'table', options: ['T-09', 'T-10', 'T-11', 'T-12'] },
  { area: 'Bar',       kind: 'table', options: ['B-01', 'B-02', 'B-03'] },
  { area: 'Private wing', kind: 'room', options: ['Fireside Room', 'Garden Room', 'Sky Lounge'] },
];

const COUNTRY_CODES = ['+91', '+1', '+44', '+61', '+971'];

// ---- Helpers ----
function nextTimeSlot() {
  const now = dayjs();
  const rounded = now.minute() < 30 ? now.minute(30) : now.add(1, 'hour').minute(0);
  return rounded.format('HH:mm');
}

function isValidTime(t: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

// ---- Screen ----
export default function AddBookingScreen() {
  const insets = useSafeAreaInsets();
  const { state, selectedRestaurant } = useApp();
  const { colors } = useTheme();

  // ---- form state ----
  const [bookingType, setBookingType] = useState<BookingType>('table');
  const [guestName, setGuestName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [time, setTime] = useState(nextTimeSlot());
  const [guests, setGuests] = useState(2);
  const [seatingArea, setSeatingArea] = useState<string | null>(null);
  const [seat, setSeat] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'confirmed'>('pending');
  const [source, setSource] = useState<BookingSource>('phone');
  const [specialRequest, setSpecialRequest] = useState('');
  const [staffNote, setStaffNote] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reset seating area/seat when type changes
  React.useEffect(() => {
    setSeatingArea(null);
    setSeat(null);
  }, [bookingType]);

  const areas = useMemo(() => SEATING_LAYOUT.filter((s) => s.kind === bookingType), [bookingType]);
  const seatsForArea = useMemo(
    () => areas.find((a) => a.area === seatingArea)?.options ?? [],
    [areas, seatingArea],
  );

  const dateOptions = useMemo(
    () => Array.from({ length: 30 }).map((_, i) => dayjs().add(i, 'day')),
    [],
  );

  // Auth guard (after hooks to satisfy rules-of-hooks)
  if (state === 'signed-out' || state === 'session-loading') return <Redirect href="/" />;
  if (!selectedRestaurant) return <Redirect href="/" />;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!guestName.trim()) e.guestName = 'Guest name is required';
    if (!phone.trim()) e.phone = 'Mobile number is required';
    else if (!/^\d{6,15}$/.test(phone.trim())) e.phone = 'Enter a valid number (digits only)';
    if (!isValidTime(time)) e.time = 'Time must be HH:MM (24h)';
    if (guests < 1) e.guests = 'At least 1 guest required';
    if (!seatingArea) e.seatingArea = 'Choose a seating area';
    if (!seat) e.seat = bookingType === 'table' ? 'Choose a table' : 'Choose a private room';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async () => {
    if (submitting) return;
    setSubmitError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const created = await api.createBooking({
        restaurant_id: selectedRestaurant.uid,
        guest_name: guestName.trim(),
        phone_code: countryCode,
        phone: phone.trim(),
        date,
        time,
        guests,
        booking_type: bookingType,
        seating_area: seatingArea!,
        seat: seat!,
        status,
        source,
        special_request: specialRequest.trim() || undefined,
        staff_note: staffNote.trim() || undefined,
      });
      setSuccessMsg(`Booking for ${created.guest_name} created`);
      setTimeout(() => {
        router.replace(`/(app)/booking?bumpKey=${created.id}`);
      }, 700);
    } catch (e: any) {
      const msg = e?.message ?? 'Something went wrong';
      setSubmitError(msg);
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.back()}
          testID="add-booking-back"
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        testID="add-booking-scroll"
      >
        {/* Booking type toggle */}
        <View style={styles.typeWrap}>
          <View style={[styles.typeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TypeBtn
              active={bookingType === 'table'}
              icon="grid"
              label="Table booking"
              onPress={() => setBookingType('table')}
              testID="type-table"
            />
            <TypeBtn
              active={bookingType === 'room'}
              icon="home"
              label="Private room"
              onPress={() => setBookingType('room')}
              testID="type-room"
            />
          </View>
        </View>

        {/* Guest details */}
        <Section label="GUEST DETAILS">
          <Field label="Full name" error={errors.guestName}>
            <TextInput
              testID="guest-name"
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Guest full name"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
            />
          </Field>

          <Field label="Mobile number" error={errors.phone}>
            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={[styles.codePicker, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => setShowCodePicker(true)}
                testID="country-code-picker"
                activeOpacity={0.8}
              >
                <Text style={[styles.codeText, { color: colors.foreground }]}>{countryCode}</Text>
                <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TextInput
                testID="guest-phone"
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/[^\d]/g, ''))}
                placeholder="90000 12345"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                style={[styles.input, { flex: 1, color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
              />
            </View>
          </Field>
        </Section>

        {/* Date + Time + Guests */}
        <Section label="DATE & TIME">
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label="Date">
                <TouchableOpacity
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                  testID="date-picker"
                >
                  <Text style={[styles.inputText, { color: colors.foreground }]}>{dayjs(date).format('ddd, D MMM')}</Text>
                </TouchableOpacity>
              </Field>
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Time (24h)" error={errors.time}>
                <TextInput
                  testID="time-input"
                  value={time}
                  onChangeText={setTime}
                  placeholder="19:30"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                  maxLength={5}
                />
              </Field>
            </View>
          </View>

          <Field label="Number of guests" error={errors.guests}>
            <View style={[styles.stepperRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.accent, borderColor: colors.border }]}
                onPress={() => setGuests(Math.max(1, guests - 1))}
                testID="guests-minus"
              >
                <Feather name="minus" size={16} color={colors.foreground} />
              </TouchableOpacity>
              <View style={styles.stepValueWrap}>
                <Text style={[styles.stepValue, { color: colors.foreground }]}>{guests}</Text>
                <Text style={[styles.stepValueLabel, { color: colors.mutedForeground }]}>{guests === 1 ? 'guest' : 'guests'}</Text>
              </View>
              <TouchableOpacity
                style={[styles.stepBtn, { backgroundColor: colors.accent, borderColor: colors.border }]}
                onPress={() => setGuests(Math.min(30, guests + 1))}
                testID="guests-plus"
              >
                <Feather name="plus" size={16} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </Field>
        </Section>

        {/* Seating */}
        <Section label="SEATING">
          <Field label="Seating area" error={errors.seatingArea}>
            <View style={styles.chipsRow}>
              {areas.map((a) => (
                <ChoiceChip
                  key={a.area}
                  label={a.area}
                  active={seatingArea === a.area}
                  onPress={() => { setSeatingArea(a.area); setSeat(null); }}
                  testID={`area-${a.area}`}
                />
              ))}
            </View>
          </Field>

          <Field label={bookingType === 'table' ? 'Available tables' : 'Available rooms'} error={errors.seat}>
            {seatingArea ? (
              <View style={styles.chipsRow}>
                {seatsForArea.map((opt) => (
                  <ChoiceChip
                    key={opt}
                    label={opt}
                    active={seat === opt}
                    onPress={() => setSeat(opt)}
                    testID={`seat-${opt}`}
                  />
                ))}
              </View>
            ) : (
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>Choose a seating area first.</Text>
            )}
          </Field>
        </Section>

        {/* Additional details */}
        <Section label="ADDITIONAL DETAILS">
          <Field label="Booking status">
            <View style={styles.chipsRow}>
              <ChoiceChip label="Pending"   active={status === 'pending'}   onPress={() => setStatus('pending')}   testID="status-pending" />
              <ChoiceChip label="Confirmed" active={status === 'confirmed'} onPress={() => setStatus('confirmed')} testID="status-confirmed" />
            </View>
          </Field>

          <Field label="Booking source">
            <View style={styles.chipsRow}>
              {(['phone', 'walk-in', 'whatsapp', 'other'] as BookingSource[]).map((s) => (
                <ChoiceChip
                  key={s}
                  label={s === 'phone' ? 'Phone' : s === 'walk-in' ? 'Walk-in' : s === 'whatsapp' ? 'WhatsApp' : 'Other'}
                  active={source === s}
                  onPress={() => setSource(s)}
                  testID={`source-${s}`}
                />
              ))}
            </View>
          </Field>

          <Field label="Special request or occasion (optional)">
            <TextInput
              testID="special-request"
              value={specialRequest}
              onChangeText={setSpecialRequest}
              placeholder="Anniversary, allergy notes, seating preference…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.input, styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
            />
          </Field>

          <Field label="Private staff note (optional)">
            <TextInput
              testID="staff-note"
              value={staffNote}
              onChangeText={setStaffNote}
              placeholder="Not visible to the guest"
              placeholderTextColor={colors.mutedForeground}
              multiline
              style={[styles.input, styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
            />
          </Field>
        </Section>

        {submitError && (
          <View style={styles.errorBox} testID="submit-error">
            <Feather name="alert-circle" size={14} color="#EF4444" />
            <Text style={styles.errorText}>{submitError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12), borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.cancelBtn, { backgroundColor: colors.card, borderColor: colors.border }, submitting && { opacity: 0.5 }]}
          onPress={() => router.back()}
          disabled={submitting}
          testID="add-booking-cancel"
          activeOpacity={0.85}
        >
          <Text style={[styles.cancelBtnText, { color: colors.foreground }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.foreground }, submitting && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={submitting}
          testID="add-booking-submit"
          activeOpacity={0.9}
        >
          {submitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Feather name="check" size={16} color={colors.background} />
              <Text style={[styles.submitBtnText, { color: colors.background }]}>Create Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Country-code picker */}
      <Modal transparent visible={showCodePicker} animationType="fade" onRequestClose={() => setShowCodePicker(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCodePicker(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Country code</Text>
            {COUNTRY_CODES.map((c) => (
              <TouchableOpacity
                key={c}
                style={styles.modalRow}
                onPress={() => { setCountryCode(c); setShowCodePicker(false); }}
                testID={`code-${c}`}
              >
                <Text style={[styles.modalRowText, { color: colors.foreground }]}>{c}</Text>
                {countryCode === c && <Feather name="check" size={16} color={colors.foreground} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date picker (list) */}
      <Modal transparent visible={showDatePicker} animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDatePicker(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '70%' }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Choose date</Text>
            <ScrollView>
              {dateOptions.map((d) => {
                const iso = d.format('YYYY-MM-DD');
                const active = iso === date;
                return (
                  <TouchableOpacity
                    key={iso}
                    style={styles.modalRow}
                    onPress={() => { setDate(iso); setShowDatePicker(false); }}
                    testID={`date-${iso}`}
                  >
                    <Text style={[styles.modalRowText, { color: colors.foreground }]}>{d.format('ddd, D MMM YYYY')}</Text>
                    {active && <Feather name="check" size={16} color={colors.foreground} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Success toast */}
      {successMsg && (
        <View style={[styles.successToast, { bottom: insets.bottom + 90 }]} testID="add-booking-success">
          <Feather name="check-circle" size={16} color="#22C55E" />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ---- subcomponents ----
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6, marginBottom: 12 }}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
      {error && (
        <View style={styles.fieldError}>
          <Feather name="alert-circle" size={11} color="#EF4444" />
          <Text style={[styles.fieldErrorText, { color: '#EF4444' }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

function TypeBtn({ active, icon, label, onPress, testID }: {
  active: boolean; icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; testID: string;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.typeBtn, active && { backgroundColor: colors.foreground }]}
      onPress={onPress}
      activeOpacity={0.85}
      testID={testID}
    >
      <Feather name={icon} size={16} color={active ? colors.background : colors.foreground} />
      <Text style={[styles.typeBtnText, { color: active ? colors.background : colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ChoiceChip({ label, active, onPress, testID }: { label: string; active: boolean; onPress: () => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      testID={testID}
      activeOpacity={0.85}
      style={[
        styles.chip,
        { backgroundColor: colors.muted, borderColor: colors.border },
        active && { backgroundColor: colors.foreground, borderColor: colors.foreground },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? colors.background : colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },

  typeWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  typeRow: {
    flexDirection: 'row',
    borderWidth: 1, borderRadius: 12, padding: 4,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 8,
  },
  typeBtnText: { fontSize: 13.5, fontWeight: '600' },

  sectionLabel: {
    fontSize: 10.5, fontWeight: '700',
    letterSpacing: 1, marginLeft: 4, marginBottom: 8, marginTop: 4,
  },
  sectionCard: {
    borderRadius: 16, borderWidth: 1,
    padding: 14,
  },

  fieldLabel: { fontSize: 12.5, fontWeight: '600', letterSpacing: 0.3 },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 15,
    minHeight: 46,
  },
  inputText: { fontSize: 15 },
  textArea: { minHeight: 72, textAlignVertical: 'top' },

  phoneRow: { flexDirection: 'row', gap: 8 },
  codePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1, borderRadius: 10,
    minWidth: 82, justifyContent: 'center',
  },
  codeText: { fontSize: 15, fontWeight: '600' },

  stepperRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  stepBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  stepValueWrap: { flex: 1, alignItems: 'center' },
  stepValue: { fontSize: 22, fontWeight: '800' },
  stepValueLabel: { fontSize: 11, marginTop: -2 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12.5, fontWeight: '600' },

  hint: { fontSize: 12, fontStyle: 'italic' },

  fieldError: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fieldErrorText: { fontSize: 11.5, fontWeight: '600' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 4, marginBottom: 8,
    backgroundColor: '#3B1D1D', borderWidth: 1, borderColor: '#7F1D1D',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  errorText: { color: '#F87171', fontSize: 13, flex: 1 },

  footer: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  submitBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitBtnText: { fontSize: 14.5, fontWeight: '700' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalCard: {
    borderRadius: 16, padding: 16, width: '100%',
    borderWidth: 1, gap: 4,
  },
  modalTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  modalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10,
  },
  modalRowText: { fontSize: 14.5 },

  successToast: {
    position: 'absolute', alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0F2D1A', borderWidth: 1, borderColor: '#22C55E',
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12,
  },
  successText: { color: '#86EFAC', fontSize: 13.5, fontWeight: '700' },
});
