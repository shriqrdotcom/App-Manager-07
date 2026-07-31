import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/src/providers/ThemeProvider';
import { storage } from '@/src/utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────
type DiscountType = 'percentage' | 'flat';

interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  description: string;
  expiryDate: string;   // ISO date string YYYY-MM-DD
  maxUses: number;      // 0 = unlimited
  usedCount: number;
  createdAt: string;
}

// ─── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'coupon_codes_v1';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isExpired(dateStr: string) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusLabel(c: Coupon) {
  if (isExpired(c.expiryDate)) return { text: 'Expired', color: '#EF4444' };
  if (c.maxUses > 0 && c.usedCount >= c.maxUses) return { text: 'Exhausted', color: '#F59E0B' };
  return { text: 'Active', color: '#22C55E' };
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={eStyles.wrap}>
      <View style={[eStyles.iconBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="tag" size={28} color={colors.mutedForeground} />
      </View>
      <Text style={[eStyles.title, { color: colors.foreground }]}>No coupons yet</Text>
      <Text style={[eStyles.sub, { color: colors.mutedForeground }]}>Create your first coupon code to offer discounts to your customers.</Text>
      <TouchableOpacity style={eStyles.btn} onPress={onAdd} activeOpacity={0.8}>
        <Feather name="plus" size={15} color="#fff" />
        <Text style={eStyles.btnText}>Create Coupon</Text>
      </TouchableOpacity>
    </View>
  );
}
const eStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  iconBox: {
    width: 72, height: 72, borderRadius: 20,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  sub: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 24 },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#829B85', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

// ─── Coupon Card ──────────────────────────────────────────────────────────────
function CouponCard({ coupon, onDelete }: { coupon: Coupon; onDelete: () => void }) {
  const { colors } = useTheme();
  const status = statusLabel(coupon);
  const usageText = coupon.maxUses === 0
    ? `${coupon.usedCount} used · Unlimited`
    : `${coupon.usedCount} / ${coupon.maxUses} used`;

  return (
    <View style={[cStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={cStyles.top}>
        {/* Code pill */}
        <View style={cStyles.codePill}>
          <Feather name="tag" size={11} color="#829B85" />
          <Text style={cStyles.codeText}>{coupon.code}</Text>
        </View>
        {/* Status badge */}
        <View style={[cStyles.badge, { backgroundColor: status.color + '22' }]}>
          <View style={[cStyles.dot, { backgroundColor: status.color }]} />
          <Text style={[cStyles.badgeText, { color: status.color }]}>{status.text}</Text>
        </View>
        {/* Delete */}
        <TouchableOpacity onPress={onDelete} style={cStyles.delBtn} hitSlop={8} activeOpacity={0.7}>
          <Feather name="trash-2" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Discount display */}
      <View style={cStyles.discountRow}>
        <Text style={[cStyles.discountVal, { color: colors.foreground }]}>
          {coupon.discountType === 'percentage'
            ? `${coupon.discountValue}% OFF`
            : `₹${coupon.discountValue} OFF`}
        </Text>
      </View>

      {coupon.description ? (
        <Text style={[cStyles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>{coupon.description}</Text>
      ) : null}

      <View style={cStyles.metaRow}>
        <View style={cStyles.metaItem}>
          <Feather name="calendar" size={11} color={colors.mutedForeground} />
          <Text style={[cStyles.metaText, { color: colors.mutedForeground }]}>Expires {formatDate(coupon.expiryDate)}</Text>
        </View>
        <View style={[cStyles.metaDot, { backgroundColor: colors.mutedForeground }]} />
        <View style={cStyles.metaItem}>
          <Feather name="users" size={11} color={colors.mutedForeground} />
          <Text style={[cStyles.metaText, { color: colors.mutedForeground }]}>{usageText}</Text>
        </View>
      </View>
    </View>
  );
}

const cStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16, gap: 10,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1A2E1B', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  codeText: { color: '#829B85', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  delBtn: { marginLeft: 'auto', padding: 4 },
  discountRow: { flexDirection: 'row', alignItems: 'center' },
  discountVal: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  desc: { fontSize: 12.5, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5 },
  metaText: { fontSize: 11.5 },
});

// ─── Form Field ───────────────────────────────────────────────────────────────
function Field({
  label, value, onChangeText, placeholder, keyboardType, maxLength, multiline, suffix,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; maxLength?: number;
  multiline?: boolean; suffix?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={fStyles.wrap}>
      <Text style={[fStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={fStyles.inputRow}>
        <TextInput
          style={[fStyles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }, multiline && { height: 72, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {suffix ? <Text style={[fStyles.suffix, { color: colors.mutedForeground }]}>{suffix}</Text> : null}
      </View>
    </View>
  );
}
const fStyles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.5, marginLeft: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1, borderRadius: 12, borderWidth: 1,
    fontSize: 14.5,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  suffix: { position: 'absolute', right: 14, fontSize: 13 },
});

// ─── Create Coupon Sheet ──────────────────────────────────────────────────────
const EMPTY_FORM = {
  code: '', discountType: 'percentage' as DiscountType, discountValue: '',
  description: '', expiryDate: '', maxUses: '',
};

function CreateSheet({
  visible, onClose, onSave,
}: {
  visible: boolean; onClose: () => void; onSave: (c: Coupon) => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Date picker
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  useEffect(() => {
    if (visible) { setForm(EMPTY_FORM); setErrors({}); setPickerDate(new Date()); }
  }, [visible]);

  const set = (key: keyof typeof EMPTY_FORM) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    // Android dismisses automatically; iOS keeps open
    if (Platform.OS === 'android') setShowPicker(false);
    if (selected) {
      setPickerDate(selected);
      // Store as YYYY-MM-DD
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, '0');
      const d = String(selected.getDate()).padStart(2, '0');
      setForm((f) => ({ ...f, expiryDate: `${y}-${m}-${d}` }));
      setErrors((e) => ({ ...e, expiryDate: '' }));
    }
  };

  // Formatted display — dd-mm-yyyy
  const displayDate = form.expiryDate
    ? form.expiryDate.split('-').reverse().join('-')
    : '';

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Code is required';
    else if (form.code.trim().length < 3) e.code = 'At least 3 characters';
    const dv = parseFloat(form.discountValue);
    if (!form.discountValue || isNaN(dv) || dv <= 0) e.discountValue = 'Enter a valid value';
    else if (form.discountType === 'percentage' && dv > 100) e.discountValue = 'Max 100%';
    if (!form.expiryDate) e.expiryDate = 'Please select an expiry date';
    const mu = parseInt(form.maxUses || '0');
    if (form.maxUses && (isNaN(mu) || mu < 0)) e.maxUses = 'Enter 0 for unlimited or a positive number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const coupon: Coupon = {
      id: generateId(),
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      description: form.description.trim(),
      expiryDate: form.expiryDate,
      maxUses: parseInt(form.maxUses || '0'),
      usedCount: 0,
      createdAt: new Date().toISOString(),
    };
    onSave(coupon);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Sheet header */}
        <View style={[sStyles.header, { paddingTop: insets.top + 6, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={sStyles.cancelBtn} activeOpacity={0.7}>
            <Text style={[sStyles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[sStyles.title, { color: colors.foreground }]}>New Coupon</Text>
          <TouchableOpacity onPress={handleSave} style={sStyles.saveBtn} activeOpacity={0.8}>
            <Text style={sStyles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[sStyles.scroll, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Coupon Code ── */}
          <View style={sStyles.section}>
            <Text style={[sStyles.sectionLabel, { color: colors.mutedForeground }]}>COUPON CODE</Text>
            <View style={[sStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Field
                label="Code"
                value={form.code}
                onChangeText={(v) => set('code')(v.toUpperCase())}
                placeholder="e.g. SAVE20"
                maxLength={20}
              />
              {errors.code ? <Text style={[sStyles.errorText, { color: '#EF4444' }]}>{errors.code}</Text> : null}
            </View>
          </View>

          {/* ── Discount ── */}
          <View style={sStyles.section}>
            <Text style={[sStyles.sectionLabel, { color: colors.mutedForeground }]}>DISCOUNT</Text>
            <View style={[sStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Type selector */}
              <Text style={[sStyles.fieldLabel, { color: colors.mutedForeground }]}>Discount Type</Text>
              <View style={sStyles.typeRow}>
                {(['percentage', 'flat'] as DiscountType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      sStyles.typeBtn,
                      { backgroundColor: colors.accent, borderColor: colors.border },
                      form.discountType === t && sStyles.typeBtnActive,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, discountType: t }))}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name={t === 'percentage' ? 'percent' : 'credit-card'}
                      size={14}
                      color={form.discountType === t ? '#fff' : colors.mutedForeground}
                    />
                    <Text style={[sStyles.typeBtnText, { color: colors.mutedForeground }, form.discountType === t && sStyles.typeBtnTextActive]}>
                      {t === 'percentage' ? 'Percentage (%)' : 'Flat Amount (₹)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[sStyles.divider, { backgroundColor: colors.border }]} />

              {/* Value */}
              <Field
                label={form.discountType === 'percentage' ? 'Percentage Off' : 'Amount Off (₹)'}
                value={form.discountValue}
                onChangeText={set('discountValue')}
                placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 100'}
                keyboardType="decimal-pad"
                suffix={form.discountType === 'percentage' ? '%' : '₹'}
              />
              {errors.discountValue ? <Text style={[sStyles.errorText, { color: '#EF4444' }]}>{errors.discountValue}</Text> : null}

              <View style={[sStyles.divider, { backgroundColor: colors.border }]} />

              {/* Description */}
              <Field
                label="Description (optional)"
                value={form.description}
                onChangeText={set('description')}
                placeholder="e.g. Weekend special offer"
                multiline
              />
            </View>
          </View>

          {/* ── Validity & Limits ── */}
          <View style={sStyles.section}>
            <Text style={[sStyles.sectionLabel, { color: colors.mutedForeground }]}>VALIDITY & LIMITS</Text>
            <View style={[sStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Date picker field */}
              <View style={sStyles.dateWrap}>
                <Text style={[sStyles.fieldLabel, { color: colors.mutedForeground }]}>DATE</Text>
                <TouchableOpacity
                  style={[sStyles.dateField, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setShowPicker(true)}
                  activeOpacity={0.8}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Select expiry date"
                >
                  <Feather name="calendar" size={15} color={colors.mutedForeground} />
                  <Text style={[sStyles.dateText, { color: colors.foreground }, !displayDate && { color: colors.mutedForeground }]}>
                    {displayDate || 'dd-mm-yyyy'}
                  </Text>
                  <Feather name="calendar" size={15} color={colors.mutedForeground} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              </View>
              {errors.expiryDate ? <Text style={[sStyles.errorText, { color: '#EF4444' }]}>{errors.expiryDate}</Text> : null}

              {/* Android — inline picker (shown/hidden) */}
              {showPicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={onDateChange}
                />
              )}

              {/* iOS — modal picker */}
              {Platform.OS === 'ios' && (
                <Modal
                  visible={showPicker}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowPicker(false)}
                >
                  <View style={sStyles.iosPickerBackdrop}>
                    <Pressable style={{ flex: 1 }} onPress={() => setShowPicker(false)} />
                    <View style={[sStyles.iosPickerSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={[sStyles.iosPickerHeader, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => setShowPicker(false)}>
                          <Text style={sStyles.iosPickerDone}>Done</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={pickerDate}
                        mode="date"
                        display="spinner"
                        minimumDate={new Date()}
                        onChange={onDateChange}
                        style={{ backgroundColor: colors.card }}
                        themeVariant="dark"
                      />
                    </View>
                  </View>
                </Modal>
              )}

              <View style={[sStyles.divider, { backgroundColor: colors.border }]} />

              <Field
                label="Max Uses (0 = unlimited)"
                value={form.maxUses}
                onChangeText={set('maxUses')}
                placeholder="e.g. 100"
                keyboardType="number-pad"
                maxLength={6}
              />
              {errors.maxUses ? <Text style={[sStyles.errorText, { color: '#EF4444' }]}>{errors.maxUses}</Text> : null}

              {/* Hint */}
              <View style={sStyles.hintRow}>
                <Feather name="info" size={11} color={colors.mutedForeground} />
                <Text style={[sStyles.hintText, { color: colors.mutedForeground }]}>
                  Set 0 in Max Uses to allow unlimited redemptions.
                </Text>
              </View>
            </View>
          </View>

          {/* Preview */}
          {form.code.trim().length > 0 && (
            <View style={sStyles.section}>
              <Text style={[sStyles.sectionLabel, { color: colors.mutedForeground }]}>PREVIEW</Text>
              <View style={sStyles.previewCard}>
                <View style={sStyles.previewTop}>
                  <View style={sStyles.previewPill}>
                    <Feather name="tag" size={11} color="#829B85" />
                    <Text style={sStyles.previewCode}>{form.code.trim().toUpperCase()}</Text>
                  </View>
                  <View style={[sStyles.previewBadge]}>
                    <View style={[sStyles.previewDot]} />
                    <Text style={sStyles.previewBadgeText}>Active</Text>
                  </View>
                </View>
                <Text style={[sStyles.previewDiscount, { color: colors.foreground }]}>
                  {form.discountValue
                    ? form.discountType === 'percentage'
                      ? `${form.discountValue}% OFF`
                      : `₹${form.discountValue} OFF`
                    : '— OFF'}
                </Text>
                {form.description ? <Text style={[sStyles.previewDesc, { color: colors.mutedForeground }]}>{form.description}</Text> : null}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const sStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 16, fontWeight: '700' },
  cancelBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  cancelText: { fontSize: 15 },
  saveBtn: { backgroundColor: '#829B85', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 10 },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  scroll: { paddingTop: 16 },
  section: { paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  sectionLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1, marginLeft: 2 },
  card: {
    borderRadius: 16,
    borderWidth: 1, padding: 16, gap: 12,
  },
  fieldLabel: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.5, marginLeft: 2 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 10,
    paddingVertical: 10, borderWidth: 1,
  },
  typeBtnActive: { backgroundColor: '#829B85', borderColor: '#829B85' },
  typeBtnText: { fontSize: 12.5, fontWeight: '600' },
  typeBtnTextActive: { color: '#fff' },
  divider: { height: StyleSheet.hairlineWidth },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintText: { fontSize: 11.5, flex: 1, lineHeight: 17 },
  errorText: { fontSize: 11.5, marginTop: -4 },
  // Date picker field
  dateWrap: { gap: 6 },
  dateField: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  dateText: { flex: 1, fontSize: 14.5, fontWeight: '500' },
  // iOS picker modal
  iosPickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  iosPickerSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1,
    paddingBottom: 32,
  },
  iosPickerHeader: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iosPickerDone: { color: '#829B85', fontSize: 15, fontWeight: '700' },
  // Preview card
  previewCard: {
    backgroundColor: '#1A2E1B', borderRadius: 16,
    borderWidth: 1, borderColor: '#829B85' + '44', padding: 16, gap: 8,
  },
  previewTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#0F2015', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  previewCode: { color: '#829B85', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  previewBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  previewDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  previewBadgeText: { color: '#22C55E', fontSize: 11, fontWeight: '700' },
  previewDiscount: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  previewDesc: { fontSize: 12.5 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CouponCodes() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  // Load
  useEffect(() => {
    (async () => {
      const saved = await storage.getItem(STORAGE_KEY, null);
      if (Array.isArray(saved)) setCoupons(saved as Coupon[]);
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback((list: Coupon[]) => {
    storage.setItem(STORAGE_KEY, list);
  }, []);

  const addCoupon = useCallback((c: Coupon) => {
    setCoupons((prev) => {
      const next = [c, ...prev];
      persist(next);
      return next;
    });
  }, [persist]);

  const deleteCoupon = useCallback((id: string) => {
    setCoupons((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persist(next);
      return next;
    });
  }, [persist]);

  const confirmDelete = (id: string, code: string) => {
    Alert.alert(
      'Delete Coupon',
      `Remove coupon "${code}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCoupon(id) },
      ],
    );
  };

  const filtered = coupons.filter((c) => {
    if (filter === 'active') return !isExpired(c.expiryDate) && (c.maxUses === 0 || c.usedCount < c.maxUses);
    if (filter === 'expired') return isExpired(c.expiryDate) || (c.maxUses > 0 && c.usedCount >= c.maxUses);
    return true;
  });

  const counts = {
    all: coupons.length,
    active: coupons.filter((c) => !isExpired(c.expiryDate) && (c.maxUses === 0 || c.usedCount < c.maxUses)).length,
    expired: coupons.filter((c) => isExpired(c.expiryDate) || (c.maxUses > 0 && c.usedCount >= c.maxUses)).length,
  };

  if (!loaded) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}
          accessible accessibilityRole="button" accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Coupon Codes</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.8}
          accessible accessibilityRole="button" accessibilityLabel="Add coupon"
        >
          <Feather name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      {coupons.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statVal, { color: colors.foreground }]}>{coupons.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statVal, { color: '#22C55E' }]}>{counts.active}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statVal, { color: '#EF4444' }]}>{counts.expired}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Expired</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statVal, { color: '#F59E0B' }]}>
              {coupons.reduce((a, c) => a + c.usedCount, 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Redemptions</Text>
          </View>
        </View>
      )}

      {/* Filter tabs */}
      {coupons.length > 0 && (
        <View style={styles.filterRow}>
          {(['all', 'active', 'expired'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
                filter === f && styles.filterBtnActive,
              ]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, { color: colors.mutedForeground }, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {' '}({counts[f]})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* List */}
      {coupons.length === 0 ? (
        <EmptyState onAdd={() => setShowCreate(true)} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <Text style={[styles.noResults, { color: colors.mutedForeground }]}>No {filter} coupons.</Text>
          ) : (
            filtered.map((c) => (
              <CouponCard key={c.id} coupon={c} onDelete={() => confirmDelete(c.id, c.code)} />
            ))
          )}
        </ScrollView>
      )}

      {/* FAB — only when list is non-empty */}
      {coupons.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
          accessible accessibilityRole="button" accessibilityLabel="Create new coupon"
        >
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.fabText}>New Coupon</Text>
        </TouchableOpacity>
      )}

      <CreateSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={addCoupon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: 17, fontWeight: '600', letterSpacing: -0.2, flex: 1,
  },
  addBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#829B85', alignItems: 'center', justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 14,
  },
  statCard: {
    flex: 1, borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center', paddingVertical: 10, gap: 2,
  },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10.5, fontWeight: '600' },

  filterRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 14,
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1,
  },
  filterBtnActive: { backgroundColor: '#829B85', borderColor: '#829B85' },
  filterText: { fontSize: 12.5, fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  list: { paddingHorizontal: 20, paddingTop: 4, gap: 12 },
  noResults: { textAlign: 'center', paddingTop: 40, fontSize: 14 },

  fab: {
    position: 'absolute', right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#829B85', borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 13,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
