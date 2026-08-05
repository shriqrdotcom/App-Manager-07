import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useScrollHeader } from '@/src/providers/ScrollHeaderProvider';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '@/src/providers/AppProvider';
import { useTheme, type ThemePalette } from '@/src/providers/ThemeProvider';
import staticColors from '@/src/constants/colors';
import { ScreenTitle, SearchBar } from '@/src/components/ui';
import { storage } from '@/src/utils/storage';
import SwipeSaveControl from '@/src/components/SwipeSaveControl';

const TAB_INDEX = 4;
const CONTACT_EMAIL_STORAGE_KEY = 'restaurant_contact_email_v1';
const CONTACT_PHONE_STORAGE_KEY = 'restaurant_contact_phone_v1';
const GOOGLE_REVIEW_STORAGE_KEY = 'restaurant_google_review_link_v1';
const DEFAULT_CONTACT_PHONE = '+91 90000 12345';

type SettingRow = {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
};

function makeStyles(colors: ThemePalette) {
  return StyleSheet.create({
    section: { paddingHorizontal: 20, marginBottom: 14, gap: 8 },
    sectionLabel: { fontSize: 10.5, fontWeight: '700', color: colors.mutedForeground, letterSpacing: 1, marginLeft: 4 },
    card: {
      backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },

    profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
    avatarLg: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
    avatarLgText: { color: colors.foreground, fontSize: 18, fontWeight: '700' },
    profileName: { color: colors.foreground, fontSize: 15.5, fontWeight: '700' },
    profileSub: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },
    rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 56 },

    teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
    teamAvatars: { flexDirection: 'row', alignItems: 'center' },
    teamAvatar: {
      width: 30, height: 30, borderRadius: 15,
      alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.card,
    },

    identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
    identityLogo: {
      width: 52, height: 52, borderRadius: 12, backgroundColor: colors.muted,
      borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    identityLogoText: { color: colors.foreground, fontSize: 16, fontWeight: '800' },
    identityName: { color: colors.foreground, fontSize: 15.5, fontWeight: '700' },
    identityDesc: { color: colors.mutedForeground, fontSize: 12, marginTop: 3 },
    editSmall: {
      width: 30, height: 30, borderRadius: 8, backgroundColor: colors.muted,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    },
    socialRow: {
      flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4,
    },
    socialBtn: {
      width: 34, height: 34, borderRadius: 8, backgroundColor: colors.muted,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    },

    settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
    settingIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { flex: 1, color: colors.foreground, fontSize: 14.5, fontWeight: '500' },
    rowValue: { color: colors.mutedForeground, fontSize: 13, marginRight: 6 },

    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 32 },
    modalCard: {
      backgroundColor: colors.card, borderRadius: 20, padding: 24, gap: 10, width: '100%',
      borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    },
    modalIcon: {
      width: 56, height: 56, borderRadius: 28, backgroundColor: '#3B1D1D',
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#7F1D1D',
    },
    modalTitle: { color: colors.foreground, fontSize: 18, fontWeight: '700' },
    modalDesc: { color: colors.mutedForeground, fontSize: 13, textAlign: 'center', marginBottom: 6 },
    modalCancelBtn: {
      flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
      backgroundColor: colors.muted, borderColor: colors.border, borderWidth: 1,
    },
    modalDestructiveBtn: {
      flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
      backgroundColor: staticColors.destructive,
    },

    toast: {
      position: 'absolute', bottom: 24, alignSelf: 'center',
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10,
    },
    toastText: { color: colors.foreground, fontSize: 13, fontWeight: '600' },

    emailModalBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.72)',
    },
    emailSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.border,
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 20,
    },
    emailCloseButton: {
      position: 'absolute',
      alignSelf: 'center',
      top: -56,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    emailSheetHandle: {
      alignSelf: 'center',
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.mutedForeground,
      marginBottom: 22,
    },
    emailSheetHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 14,
      marginBottom: 24,
    },
    emailSheetIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emailSheetEyebrow: {
      color: colors.mutedForeground,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.5,
      marginBottom: 5,
    },
    emailSheetTitle: {
      color: colors.foreground,
      fontSize: 25,
      fontWeight: '800',
      letterSpacing: -0.6,
    },
    emailSheetSubtitle: {
      color: colors.mutedForeground,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 5,
    },
    emailSectionLabel: {
      color: colors.mutedForeground,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.4,
      marginBottom: 9,
    },
    currentEmailCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 14,
      marginBottom: 22,
    },
    currentEmailIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 11,
    },
    currentEmailText: {
      flex: 1,
      color: colors.foreground,
      fontSize: 14,
      fontWeight: '700',
    },
    activePill: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },
    activePillText: {
      color: colors.foreground,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    emailInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      minHeight: 54,
    },
    emailInputWrapInvalid: {
      borderColor: colors.foreground,
    },
    emailInput: {
      flex: 1,
      color: colors.foreground,
      fontSize: 15,
      paddingVertical: 14,
      paddingHorizontal: 10,
    },
    emailInputClear: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emailError: {
      color: colors.foreground,
      fontSize: 11,
      marginTop: 8,
    },
    emailHint: {
      color: colors.mutedForeground,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 9,
    },
    emailSheetActions: {
      marginTop: 26,
    },
    emailSaveButton: {
      width: '100%',
      minHeight: 58,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    emailSaveButtonDisabled: {
      opacity: 0.45,
    },
    emailSaveText: {
      color: colors.primaryForeground,
      fontSize: 14,
      fontWeight: '800',
    },

    googleReviewCurrentCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 14,
      marginBottom: 22,
      gap: 11,
    },
    googleReviewCurrentIcon: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: '#3B82F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    googleReviewCurrentCopy: {
      flex: 1,
      minWidth: 0,
    },
    googleReviewCurrentText: {
      color: colors.foreground,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: '700',
    },
    googleReviewCurrentHint: {
      color: colors.mutedForeground,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 3,
    },
  });
}

type StylesType = ReturnType<typeof makeStyles>;

export default function Settings() {
  const { bootstrap, selectedRestaurant, logout } = useApp();
  const { preference, resolvedTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const user = bootstrap?.user;
  const [search, setSearch] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState(user?.email ?? 'demo@exzibo.com');
  const [emailDraft, setEmailDraft] = useState(contactEmail);
  const [emailSheetVisible, setEmailSheetVisible] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const emailSheetProgress = useSharedValue(0);
  const emailSheetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: emailSheetProgress.value,
    transform: [{ translateY: (1 - emailSheetProgress.value) * 420 }],
  }));
  const [contactPhone, setContactPhone] = useState(DEFAULT_CONTACT_PHONE);
  const [phoneDraft, setPhoneDraft] = useState(DEFAULT_CONTACT_PHONE);
  const [phoneSheetVisible, setPhoneSheetVisible] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const phoneSheetProgress = useSharedValue(0);
  const phoneSheetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: phoneSheetProgress.value,
    transform: [{ translateY: (1 - phoneSheetProgress.value) * 420 }],
  }));
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [googleReviewDraft, setGoogleReviewDraft] = useState('');
  const [googleReviewError, setGoogleReviewError] = useState<string | null>(null);
  const [googleReviewSheetVisible, setGoogleReviewSheetVisible] = useState(false);
  const [googleReviewSheetSession, setGoogleReviewSheetSession] = useState(0);
  const googleReviewSheetProgress = useSharedValue(0);
  const googleReviewSheetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: googleReviewSheetProgress.value,
    transform: [{ translateY: (1 - googleReviewSheetProgress.value) * 520 }],
  }));

  useEffect(() => {
    const fallbackEmail = user?.email ?? 'demo@exzibo.com';
    setContactEmail(fallbackEmail);
    setEmailDraft(fallbackEmail);
    setContactPhone(DEFAULT_CONTACT_PHONE);
    setPhoneDraft(DEFAULT_CONTACT_PHONE);

    let active = true;
    void storage.getItem(CONTACT_EMAIL_STORAGE_KEY, fallbackEmail).then((saved) => {
      if (active && typeof saved === 'string' && saved.trim()) {
        setContactEmail(saved);
        setEmailDraft(saved);
      }
    });
    void storage.getItem(CONTACT_PHONE_STORAGE_KEY, DEFAULT_CONTACT_PHONE).then((saved) => {
      if (active && typeof saved === 'string' && saved.trim()) {
        setContactPhone(saved);
        setPhoneDraft(saved);
      }
    });
    void storage.getItem(GOOGLE_REVIEW_STORAGE_KEY, '').then((saved) => {
      if (active && typeof saved === 'string') {
        setGoogleReviewUrl(saved);
        setGoogleReviewDraft(saved);
      }
    });

    return () => {
      active = false;
    };
  }, [user?.email]);

  const restaurantName = selectedRestaurant?.name ?? 'Exzibo Manager';
  const restaurantInitials = restaurantName
    .split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('');

  const onLogout = async () => {
    setConfirmLogout(false);
    setToast('Signing out…');
    await logout();
  };

  const openRow = (label: string) => {
    setToast(`${label} — coming soon`);
    setTimeout(() => setToast(null), 1500);
  };

  const openContactEmail = () => {
    setEmailDraft(contactEmail);
    setEmailError(null);
    setEmailSheetVisible(true);
    emailSheetProgress.value = 0;
    emailSheetProgress.value = withTiming(1, { duration: 280 });
  };

  const closeContactEmail = useCallback(() => {
    emailSheetProgress.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) runOnJS(setEmailSheetVisible)(false);
    });
  }, [emailSheetProgress]);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const saveContactEmail = async () => {
    const nextEmail = emailDraft.trim().toLowerCase();
    if (!isValidEmail(nextEmail)) {
      setEmailError('Enter a valid email address, like hello@restaurant.com.');
      return;
    }

    setContactEmail(nextEmail);
    await storage.setItem(CONTACT_EMAIL_STORAGE_KEY, nextEmail);
    closeContactEmail();
    setToast('Contact email updated');
    setTimeout(() => setToast(null), 1800);
  };

  const openMobileNumber = () => {
    setPhoneDraft(contactPhone);
    setPhoneError(null);
    setPhoneSheetVisible(true);
    phoneSheetProgress.value = 0;
    phoneSheetProgress.value = withTiming(1, { duration: 280 });
  };

  const closeMobileNumber = useCallback(() => {
    phoneSheetProgress.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) runOnJS(setPhoneSheetVisible)(false);
    });
  }, [phoneSheetProgress]);

  const isValidPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7 && /^[+\d\s().-]+$/.test(value.trim());
  };

  const saveMobileNumber = async () => {
    const nextPhone = phoneDraft.trim();
    if (!isValidPhone(nextPhone)) {
      setPhoneError('Enter a valid contact number with at least 7 digits.');
      return;
    }

    setContactPhone(nextPhone);
    await storage.setItem(CONTACT_PHONE_STORAGE_KEY, nextPhone);
    closeMobileNumber();
    setToast('Mobile number updated');
    setTimeout(() => setToast(null), 1800);
  };

  const openGoogleReviewLink = () => {
    setGoogleReviewDraft(googleReviewUrl);
    setGoogleReviewError(null);
    setGoogleReviewSheetSession((session) => session + 1);
    setGoogleReviewSheetVisible(true);
    googleReviewSheetProgress.value = 0;
    googleReviewSheetProgress.value = withTiming(1, { duration: 280 });
  };

  const closeGoogleReviewLink = useCallback(() => {
    googleReviewSheetProgress.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) runOnJS(setGoogleReviewSheetVisible)(false);
    });
  }, [googleReviewSheetProgress]);

  const isValidGoogleReviewUrl = (value: string) => {
    try {
      const url = new URL(value.trim());
      return url.protocol === 'https:' && Boolean(url.hostname);
    } catch {
      return false;
    }
  };

  const saveGoogleReviewLink = async () => {
    const nextUrl = googleReviewDraft.trim();
    if (!isValidGoogleReviewUrl(nextUrl)) {
      setGoogleReviewError('Enter a secure Google review URL starting with https://.');
      return;
    }

    await storage.setItem(GOOGLE_REVIEW_STORAGE_KEY, nextUrl);
    setGoogleReviewUrl(nextUrl);
    setGoogleReviewDraft(nextUrl);
    setGoogleReviewError(null);
    closeGoogleReviewLink();
    setToast('Google review link updated');
    setTimeout(() => setToast(null), 1800);
  };

  const accountRows: SettingRow[] = [
    { key: 'notifications', icon: 'bell',     color: '#EF4444', label: 'Notifications', onPress: () => router.push('/(app)/notification-settings') },
    {
      key: 'theme',
      icon: 'droplet',
      color: '#8B5CF6',
      label: 'Theme',
      value: preference === 'system' ? 'System default' : preference === 'light' ? 'Light' : 'Dark',
      onPress: () => router.push('/(app)/theme-settings'),
    },
    { key: 'help',          icon: 'help-circle', color: '#F59E0B', label: 'Help Center', onPress: () => openRow('Help Center') },
  ];

  const restRows: SettingRow[] = [
    { key: 'hours',    icon: 'clock',    color: '#22C55E', label: 'Timing',          value: '11am · 11pm', onPress: () => router.push('/(app)/timing-settings') },
    { key: 'email',    icon: 'mail',     color: '#3B82F6', label: 'Contact Email',    value: contactEmail, onPress: openContactEmail },
    { key: 'phone',    icon: 'phone',    color: '#22C55E', label: 'Mobile Number',    value: contactPhone, onPress: openMobileNumber },
    { key: 'location', icon: 'map-pin',  color: '#8B5CF6', label: 'Restaurant Location', value: 'Bandra West',    onPress: () => router.push('/(app)/restaurant-location') },
  ];

  const promoRows: SettingRow[] = [
    { key: 'coupons', icon: 'tag', color: '#829B85', label: 'Coupon Codes', onPress: () => router.push('/(app)/coupon-codes') },
  ];

  const publicRows: SettingRow[] = [
    { key: 'google-review', icon: 'star',    color: '#3B82F6', label: 'Google Review',      onPress: openGoogleReviewLink },
    { key: 'hero-gallery',  icon: 'image',   color: '#F59E0B', label: 'Gallery',            onPress: () => openRow('Hero Image Gallery') },
    { key: 'gallery-text',  icon: 'type',    color: '#06B6D4', label: 'Gallery Text',       onPress: () => openRow('Gallery Text') },
    { key: 'about',         icon: 'info',    color: '#EC4899', label: 'Philosophy / About Us', onPress: () => openRow('About') },
  ];

  const secRows: SettingRow[] = [
    { key: 'privacy',  icon: 'shield',   color: '#22C55E', label: 'Privacy',         onPress: () => openRow('Privacy') },
    { key: 'app-info', icon: 'info',     color: '#3B82F6', label: 'App Information', value: 'v0.1.0', onPress: () => openRow('App Information') },
    { key: 'logout',   icon: 'log-out',  color: '#EF4444', label: 'Logout',          destructive: true, onPress: () => setConfirmLogout(true) },
  ];

  const filter = (rows: SettingRow[]) =>
    search ? rows.filter((r) => r.label.toLowerCase().includes(search.toLowerCase())) : rows;

  const { scrollY, reportTabScroll } = useScrollHeader();
  const updatePos = useCallback((y: number) => { reportTabScroll(TAB_INDEX, y); }, [reportTabScroll]);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
    runOnJS(updatePos)(e.contentOffset.y);
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 64, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        testID="settings-screen"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <ScreenTitle testID="settings-title">Settings</ScreenTitle>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search" testID="settings-search" />

        {/* User + team card */}
        <View style={styles.section}>
          <View style={styles.card}>
            <TouchableOpacity style={styles.profileRow} activeOpacity={0.7} testID="settings-profile">
              <View style={styles.avatarLg}>
                <Text style={styles.avatarLgText}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.profileName} numberOfLines={1}>{user?.name ?? '—'}</Text>
                <Text style={styles.profileSub} numberOfLines={1}>Admin profile, photo & account settings</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={styles.rowDivider} />
            <TouchableOpacity style={styles.teamRow} activeOpacity={0.7} testID="settings-team" onPress={() => router.push('/(app)/team-access')}>
              <View style={styles.teamAvatars}>
                {['#F59E0B', '#8B5CF6', '#3B82F6'].map((c, i) => (
                  <View key={i} style={[styles.teamAvatar, { backgroundColor: c, marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i }]}>
                    <Feather name="user" size={12} color="#fff" />
                  </View>
                ))}
              </View>
              <Text style={styles.rowLabel}>Team access</Text>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Restaurant identity */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RESTAURANT</Text>
          <View style={styles.card}>
            <View style={styles.identityRow}>
              <View style={styles.identityLogo}>
                <Text style={styles.identityLogoText}>{restaurantInitials}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.identityName} numberOfLines={1}>{restaurantName}</Text>
                <Text style={styles.identityDesc} numberOfLines={2}>
                  {selectedRestaurant?.role ? `${selectedRestaurant.role.toUpperCase()} · ` : ''}
                  Modern kitchen, warm hospitality.
                </Text>
              </View>
              <TouchableOpacity style={styles.editSmall} testID="settings-edit-restaurant">
                <Feather name="edit-2" size={13} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            <View style={styles.socialRow}>
              {['instagram', 'facebook', 'twitter', 'youtube'].map((s) => (
                <TouchableOpacity key={s} style={styles.socialBtn} testID={`social-${s}`} activeOpacity={0.7}>
                  <Feather name={s as any} size={14} color={colors.foreground} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Section title="ACCOUNT & TEAM" rows={filter(accountRows)} colors={colors} styles={styles} />
        <Section title="RESTAURANT INFORMATION" rows={filter(restRows)} colors={colors} styles={styles} />
        <Section title="PROMOTIONS" rows={filter(promoRows)} colors={colors} styles={styles} />
        <Section title="PUBLIC CONTENT" rows={filter(publicRows)} colors={colors} styles={styles} />
        <Section title="SECURITY & APPLICATION" rows={filter(secRows)} colors={colors} styles={styles} />
      </Animated.ScrollView>

      {/* Logout confirmation */}
      <Modal visible={confirmLogout} transparent animationType="fade" onRequestClose={() => setConfirmLogout(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmLogout(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalIcon}>
              <Feather name="log-out" size={22} color={staticColors.destructive} />
            </View>
            <Text style={styles.modalTitle}>Sign out?</Text>
            <Text style={styles.modalDesc}>You&apos;ll need to sign in again to access this workspace.</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setConfirmLogout(false)}
                testID="logout-cancel"
              >
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDestructiveBtn}
                onPress={onLogout}
                testID="logout-confirm"
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Contact email editor */}
      <Modal
        visible={emailSheetVisible}
        transparent
        animationType="none"
        onRequestClose={closeContactEmail}
      >
        <View style={styles.emailModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeContactEmail}
            accessibilityLabel="Close contact email editor"
          />
          <Animated.View
            style={[styles.emailSheet, { paddingBottom: insets.bottom + 20 }, emailSheetAnimatedStyle]}
            testID="contact-email-sheet"
          >
            <TouchableOpacity
              style={styles.emailCloseButton}
              onPress={closeContactEmail}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close contact email editor"
              testID="contact-email-close"
            >
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View style={styles.emailSheetHandle} />

            <View style={styles.emailSheetHeader}>
              <View style={styles.emailSheetIcon}>
                <Feather name="mail" size={22} color={colors.primaryForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emailSheetEyebrow}>RESTAURANT PROFILE</Text>
                <Text style={styles.emailSheetTitle}>Contact email</Text>
                <Text style={styles.emailSheetSubtitle}>
                  Keep your restaurant&apos;s inbox ready for guest messages.
                </Text>
              </View>
            </View>

            <Text style={styles.emailSectionLabel}>CURRENT ADDRESS</Text>
            <View style={styles.currentEmailCard}>
              <View style={styles.currentEmailIcon}>
                <Feather name="check" size={16} color={colors.foreground} />
              </View>
              <Text style={styles.currentEmailText} numberOfLines={1}>{contactEmail}</Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>ACTIVE</Text>
              </View>
            </View>

            <Text style={styles.emailSectionLabel}>CHANGE EMAIL</Text>
            <View style={[styles.emailInputWrap, emailError && styles.emailInputWrapInvalid]}>
              <Feather name="at-sign" size={17} color={colors.mutedForeground} />
              <TextInput
                value={emailDraft}
                onChangeText={(value) => {
                  setEmailDraft(value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="hello@restaurant.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={colors.foreground}
                style={styles.emailInput}
                testID="contact-email-input"
                accessibilityLabel="New restaurant contact email"
              />
              {emailDraft.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setEmailDraft('');
                    setEmailError(null);
                  }}
                  style={styles.emailInputClear}
                  accessibilityLabel="Clear email"
                  hitSlop={8}
                >
                  <Feather name="x" size={13} color={colors.foreground} />
                </TouchableOpacity>
              )}
            </View>
            {emailError ? (
              <Text style={styles.emailError}>{emailError}</Text>
            ) : (
              <Text style={styles.emailHint}>This is where guest enquiries and restaurant notifications will arrive.</Text>
            )}

            <View style={styles.emailSheetActions}>
              <TouchableOpacity
                style={[
                  styles.emailSaveButton,
                  !isValidEmail(emailDraft) && styles.emailSaveButtonDisabled,
                ]}
                onPress={saveContactEmail}
                activeOpacity={0.8}
                testID="contact-email-save"
              >
                <Feather name="check" size={16} color={colors.primaryForeground} />
                <Text style={styles.emailSaveText}>Save Email</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Mobile number editor */}
      <Modal
        visible={phoneSheetVisible}
        transparent
        animationType="none"
        onRequestClose={closeMobileNumber}
      >
        <View style={styles.emailModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeMobileNumber}
            accessibilityLabel="Close mobile number editor"
          />
          <Animated.View
            style={[styles.emailSheet, { paddingBottom: insets.bottom + 20 }, phoneSheetAnimatedStyle]}
            testID="mobile-number-sheet"
          >
            <TouchableOpacity
              style={styles.emailCloseButton}
              onPress={closeMobileNumber}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close mobile number editor"
              testID="mobile-number-close"
            >
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View style={styles.emailSheetHandle} />

            <View style={styles.emailSheetHeader}>
              <View style={styles.emailSheetIcon}>
                <Feather name="phone" size={22} color={colors.primaryForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emailSheetEyebrow}>RESTAURANT PROFILE</Text>
                <Text style={styles.emailSheetTitle}>Mobile number</Text>
                <Text style={styles.emailSheetSubtitle}>
                  Keep your restaurant&apos;s phone line ready for guest calls.
                </Text>
              </View>
            </View>

            <Text style={styles.emailSectionLabel}>CURRENT NUMBER</Text>
            <View style={styles.currentEmailCard}>
              <View style={styles.currentEmailIcon}>
                <Feather name="check" size={16} color={colors.foreground} />
              </View>
              <Text style={styles.currentEmailText} numberOfLines={1}>{contactPhone}</Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>ACTIVE</Text>
              </View>
            </View>

            <Text style={styles.emailSectionLabel}>CHANGE NUMBER</Text>
            <View style={[styles.emailInputWrap, phoneError && styles.emailInputWrapInvalid]}>
              <Feather name="phone" size={17} color={colors.mutedForeground} />
              <TextInput
                value={phoneDraft}
                onChangeText={(value) => {
                  setPhoneDraft(value);
                  if (phoneError) setPhoneError(null);
                }}
                placeholder="+91 90000 12345"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={colors.foreground}
                style={styles.emailInput}
                testID="mobile-number-input"
                accessibilityLabel="New restaurant mobile number"
              />
              {phoneDraft.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setPhoneDraft('');
                    setPhoneError(null);
                  }}
                  style={styles.emailInputClear}
                  accessibilityLabel="Clear mobile number"
                  hitSlop={8}
                >
                  <Feather name="x" size={13} color={colors.foreground} />
                </TouchableOpacity>
              )}
            </View>
            {phoneError ? (
              <Text style={styles.emailError}>{phoneError}</Text>
            ) : (
              <Text style={styles.emailHint}>This is where guests can reach your restaurant directly.</Text>
            )}

            <View style={styles.emailSheetActions}>
              <TouchableOpacity
                style={[
                  styles.emailSaveButton,
                  !isValidPhone(phoneDraft) && styles.emailSaveButtonDisabled,
                ]}
                onPress={saveMobileNumber}
                activeOpacity={0.8}
                testID="mobile-number-save"
              >
                <Feather name="check" size={16} color={colors.primaryForeground} />
                <Text style={styles.emailSaveText}>Save Number</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Google review link editor */}
      <Modal
        visible={googleReviewSheetVisible}
        transparent
        animationType="none"
        onRequestClose={closeGoogleReviewLink}
      >
        <View style={styles.emailModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeGoogleReviewLink}
            accessibilityLabel="Close Google review link editor"
          />
          <Animated.View
            style={[styles.emailSheet, { paddingBottom: insets.bottom + 20 }, googleReviewSheetAnimatedStyle]}
            testID="google-review-link-sheet"
          >
            <TouchableOpacity
              style={styles.emailCloseButton}
              onPress={closeGoogleReviewLink}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close Google review link editor"
              testID="google-review-link-close"
            >
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View style={styles.emailSheetHandle} />

            <View style={styles.emailSheetHeader}>
              <View style={styles.emailSheetIcon}>
                <Feather name="star" size={22} color={colors.primaryForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emailSheetEyebrow}>RESTAURANT PROFILE</Text>
                <Text style={styles.emailSheetTitle}>Google review link</Text>
                <Text style={styles.emailSheetSubtitle}>
                  Give guests a direct path to leave a review for your restaurant.
                </Text>
              </View>
            </View>

            <Text style={styles.emailSectionLabel}>CURRENT URL</Text>
            <View style={styles.googleReviewCurrentCard} testID="google-review-current">
              <View style={styles.googleReviewCurrentIcon}>
                <Feather name="star" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.googleReviewCurrentCopy}>
                <Text style={styles.googleReviewCurrentText} numberOfLines={2}>
                  {googleReviewUrl || 'No review link added yet'}
                </Text>
                <Text style={styles.googleReviewCurrentHint}>
                  {googleReviewUrl
                    ? 'This link is ready to share with guests.'
                    : 'Add a URL below to activate this setting.'}
                </Text>
              </View>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>{googleReviewUrl ? 'ACTIVE' : 'EMPTY'}</Text>
              </View>
            </View>

            <Text style={styles.emailSectionLabel}>CHANGE URL</Text>
            <View style={[styles.emailInputWrap, googleReviewError && styles.emailInputWrapInvalid]}>
              <Feather name="link" size={17} color={colors.mutedForeground} />
              <TextInput
                value={googleReviewDraft}
                onChangeText={(value) => {
                  setGoogleReviewDraft(value);
                  if (googleReviewError) setGoogleReviewError(null);
                }}
                placeholder="https://g.page/r/your-restaurant/review"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={colors.foreground}
                style={styles.emailInput}
                testID="google-review-url-input"
                accessibilityLabel="Google review URL"
              />
              {googleReviewDraft.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setGoogleReviewDraft('');
                    setGoogleReviewError(null);
                  }}
                  style={styles.emailInputClear}
                  accessibilityLabel="Clear Google review URL"
                  hitSlop={8}
                >
                  <Feather name="x" size={13} color={colors.foreground} />
                </TouchableOpacity>
              )}
            </View>
            {googleReviewError ? (
              <Text style={styles.emailError} testID="google-review-url-error">{googleReviewError}</Text>
            ) : (
              <Text style={styles.emailHint}>
                Paste the Google review link from your Business Profile. It should begin with https://.
              </Text>
            )}

            <View style={styles.emailSheetActions}>
              <SwipeSaveControl
                enabled={isValidGoogleReviewUrl(googleReviewDraft)}
                colors={colors}
                resolvedTheme={resolvedTheme}
                onConfirm={saveGoogleReviewLink}
                resetKey={googleReviewSheetSession}
                testID="google-review-url-save"
              />
            </View>
          </Animated.View>
        </View>
      </Modal>

      {toast && (
        <View style={styles.toast} testID="settings-toast">
          <Feather name="info" size={14} color={colors.info} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

function Section({ title, rows, colors, styles }: { title: string; rows: SettingRow[]; colors: ThemePalette; styles: StylesType }) {
  if (!rows.length) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.card}>
        {rows.map((r, i) => (
          <React.Fragment key={r.key}>
            <TouchableOpacity style={styles.settingRow} onPress={r.onPress} activeOpacity={0.7} testID={`setting-${r.key}`}>
              <View style={[styles.settingIcon, { backgroundColor: r.color }]}>
                <Feather name={r.icon} size={14} color="#fff" />
              </View>
              <Text style={[styles.rowLabel, r.destructive && { color: staticColors.destructive }]}>{r.label}</Text>
              {r.value && <Text style={styles.rowValue}>{r.value}</Text>}
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            {i < rows.length - 1 && <View style={styles.rowDivider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
