import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '@/src/providers/AppProvider';
import colors from '@/src/constants/colors';
import { ScreenTitle, SearchBar } from '@/src/components/ui';

type SettingRow = {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
};

export default function Settings() {
  const { bootstrap, selectedRestaurant, logout } = useApp();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const user = bootstrap?.user;

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

  const accountRows: SettingRow[] = [
    { key: 'notifications', icon: 'bell',     color: '#EF4444', label: 'Notifications', onPress: () => router.push('/(app)/notification-settings') },
    { key: 'theme',         icon: 'droplet',  color: '#8B5CF6', label: 'Theme', value: 'Dark', onPress: () => router.push('/(app)/theme-settings') },
    { key: 'language',      icon: 'globe',    color: '#3B82F6', label: 'Language', value: 'English', onPress: () => openRow('Language') },
    { key: 'help',          icon: 'help-circle', color: '#F59E0B', label: 'Help Center', onPress: () => openRow('Help Center') },
  ];

  const restRows: SettingRow[] = [
    { key: 'hours',    icon: 'clock',    color: '#22C55E', label: 'Opening Hours',    value: '11am · 11pm', onPress: () => openRow('Opening Hours') },
    { key: 'email',    icon: 'mail',     color: '#3B82F6', label: 'Contact Email',    value: user?.email ?? '—', onPress: () => openRow('Contact Email') },
    { key: 'phone',    icon: 'phone',    color: '#22C55E', label: 'Mobile Number',    value: '+91 90000 12345', onPress: () => openRow('Mobile Number') },
    { key: 'location', icon: 'map-pin',  color: '#8B5CF6', label: 'Restaurant Location', value: 'Bandra West',    onPress: () => openRow('Restaurant Location') },
  ];

  const promoRows: SettingRow[] = [
    { key: 'coupons', icon: 'tag', color: '#829B85', label: 'Coupon Codes', onPress: () => router.push('/(app)/coupon-codes') },
  ];

  const publicRows: SettingRow[] = [
    { key: 'google-review', icon: 'star',    color: '#3B82F6', label: 'Google Review Link', onPress: () => openRow('Google Review Link') },
    { key: 'hero-gallery',  icon: 'image',   color: '#F59E0B', label: 'Hero Image Gallery', onPress: () => openRow('Hero Image Gallery') },
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        testID="settings-screen"
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
            <TouchableOpacity style={styles.teamRow} activeOpacity={0.7} testID="settings-team">
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

        <Section title="ACCOUNT & TEAM" rows={filter(accountRows)} />
        <Section title="RESTAURANT INFORMATION" rows={filter(restRows)} />
        <Section title="PROMOTIONS" rows={filter(promoRows)} />
        <Section title="PUBLIC CONTENT" rows={filter(publicRows)} />
        <Section title="SECURITY & APPLICATION" rows={filter(secRows)} />
      </ScrollView>

      {/* Logout confirmation */}
      <Modal visible={confirmLogout} transparent animationType="fade" onRequestClose={() => setConfirmLogout(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmLogout(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalIcon}>
              <Feather name="log-out" size={22} color={colors.destructive} />
            </View>
            <Text style={styles.modalTitle}>Sign out?</Text>
            <Text style={styles.modalDesc}>You&apos;ll need to sign in again to access this workspace.</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#242526', borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setConfirmLogout(false)}
                testID="logout-cancel"
              >
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.destructive }]}
                onPress={onLogout}
                testID="logout-confirm"
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
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

function Section({ title, rows }: { title: string; rows: SettingRow[] }) {
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
              <Text style={[styles.rowLabel, r.destructive && { color: colors.destructive }]}>{r.label}</Text>
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

const styles = StyleSheet.create({
  section: { paddingHorizontal: 20, marginBottom: 14, gap: 8 },
  sectionLabel: { fontSize: 10.5, fontWeight: '700', color: colors.mutedForeground, letterSpacing: 1, marginLeft: 4 },
  card: {
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  avatarLg: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#2A2B2C', alignItems: 'center', justifyContent: 'center' },
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
    width: 52, height: 52, borderRadius: 12, backgroundColor: '#242526',
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  identityLogoText: { color: colors.foreground, fontSize: 16, fontWeight: '800' },
  identityName: { color: colors.foreground, fontSize: 15.5, fontWeight: '700' },
  identityDesc: { color: colors.mutedForeground, fontSize: 12, marginTop: 3 },
  editSmall: {
    width: 30, height: 30, borderRadius: 8, backgroundColor: '#242526',
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  socialRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4,
  },
  socialBtn: {
    width: 34, height: 34, borderRadius: 8, backgroundColor: '#242526',
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
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },

  toast: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#26272A', borderWidth: 1, borderColor: colors.border,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10,
  },
  toastText: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
});
