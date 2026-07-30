import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme, type ThemePalette } from '@/src/providers/ThemeProvider';

// ─── Fixed accent colours (same in both themes) ───────────────────────────────
const ACCENT = {
  plusBtn:           '#9B8FD4',
  badgeReviewed:     '#D8FF6E',
  badgeReviewedText: '#1A1A00',
  badgeVerified:     '#C4B5FD',
  badgeVerifiedText: '#1A004A',
  badgeNeeds:        '#67E8F9',
  badgeNeedsText:    '#001A1E',
};

// ─── Mock data ────────────────────────────────────────────────────────────────
type Status = 'Reviewed' | 'Verified' | 'Needs Update';

type Member = {
  id: string;
  name: string;
  role: string;
  workType: string;
  joined: string;
  status: Status;
  initials: string;
  avatarColor: string;
};

const MEMBERS: Member[] = [
  { id: '1', name: 'Daniel Carter',   role: 'Product Designer',  workType: 'Employee',   joined: 'Jan 12, 2023', status: 'Reviewed',     initials: 'DC', avatarColor: '#7C6A5F' },
  { id: '2', name: 'Aisha Patel',     role: 'HR Specialist',     workType: 'Employee',   joined: 'Mar 4, 2022',  status: 'Verified',     initials: 'AP', avatarColor: '#6B6B8A' },
  { id: '3', name: 'Noah Bennett',    role: 'Data Analyst',      workType: 'Employee',   joined: 'Jul 19, 2023', status: 'Needs Update', initials: 'NB', avatarColor: '#4E7068' },
  { id: '4', name: 'Isabella Flores', role: 'Marketing Lead',    workType: 'Employee',   joined: 'Nov 1, 2021',  status: 'Reviewed',     initials: 'IF', avatarColor: '#7A5E42' },
  { id: '5', name: 'Liam Thompson',   role: 'Backend Engineer',  workType: 'Contractor', joined: 'Feb 28, 2024', status: 'Verified',     initials: 'LT', avatarColor: '#3A6478' },
  { id: '6', name: 'Priya Sharma',    role: 'UX Researcher',     workType: 'Employee',   joined: 'Sep 9, 2022',  status: 'Needs Update', initials: 'PS', avatarColor: '#6A3A7A' },
];

const TABS = ['All members', 'Admin', 'Manager', 'Employee'];

// ─── Dynamic styles factory ───────────────────────────────────────────────────
function makeStyles(colors: ThemePalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
      gap: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      fontSize: 28,
      fontWeight: '800',
      color: colors.foreground,
      letterSpacing: -0.5,
    },
    plusBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: ACCENT.plusBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Tab bar
    tabBar: {
      flexShrink: 0,
      flexGrow: 0,
      marginTop: 4,
    },
    tabBarContent: {
      paddingHorizontal: 20,
      gap: 8,
      paddingBottom: 12,
      alignItems: 'center',
    },
    tab: {
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 22,
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabActive: {
      backgroundColor: colors.foreground,
      borderColor: colors.foreground,
    },
    tabText: {
      fontSize: 13.5,
      fontWeight: '500',
      color: colors.mutedForeground,
    },
    tabTextActive: {
      color: colors.background,
      fontWeight: '700',
    },

    // Search
    searchRow: {
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.muted,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      height: 48,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
      paddingVertical: 0,
    },
    filterBtn: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },

    // List
    list: { flex: 1 },
    listContent: {
      paddingHorizontal: 20,
      gap: 10,
    },
    emptyText: {
      color: colors.mutedForeground,
      textAlign: 'center',
      marginTop: 40,
      fontSize: 14,
    },

    // Card
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 14,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    cardInfo: { flex: 1, minWidth: 0 },
    memberName: {
      fontSize: 15.5,
      fontWeight: '700',
      color: colors.foreground,
    },
    memberRole: {
      fontSize: 12.5,
      color: colors.mutedForeground,
      marginTop: 2,
    },

    // Card divider
    cardDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginBottom: 12,
    },

    // Meta row
    cardMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    metaItem: { flex: 1 },
    metaValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.foreground,
    },
    metaLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    metaCentered: {
      alignItems: 'center',
    },
    metaMoreWrap: {
      width: 30,
      alignItems: 'flex-end',
    },
    moreBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.muted,
    },

    // Avatar
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    avatarText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    // Badge
    badge: {
      paddingHorizontal: 11,
      paddingVertical: 5,
      borderRadius: 20,
    },
    badgeText: {
      fontSize: 11.5,
      fontWeight: '700',
    },
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, styles }: { status: Status; styles: ReturnType<typeof makeStyles> }) {
  let bg: string;
  let fg: string;

  if (status === 'Reviewed') {
    bg = ACCENT.badgeReviewed;
    fg = ACCENT.badgeReviewedText;
  } else if (status === 'Verified') {
    bg = ACCENT.badgeVerified;
    fg = ACCENT.badgeVerifiedText;
  } else {
    bg = ACCENT.badgeNeeds;
    fg = ACCENT.badgeNeedsText;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{status}</Text>
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ initials, color, styles }: { initials: string; color: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────
function MemberCard({
  member,
  styles,
  mutedColor,
}: {
  member: Member;
  styles: ReturnType<typeof makeStyles>;
  mutedColor: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Avatar initials={member.initials} color={member.avatarColor} styles={styles} />
        <View style={styles.cardInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberRole}>{member.role}</Text>
        </View>
        <StatusBadge status={member.status} styles={styles} />
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>{member.workType}</Text>
          <Text style={styles.metaLabel}>Work type</Text>
        </View>
        <View style={[styles.metaItem, styles.metaCentered]}>
          <Text style={styles.metaValue}>{member.joined}</Text>
          <Text style={styles.metaLabel}>Joined</Text>
        </View>
        {/* Reserved for future setting */}
        <View style={styles.metaMoreWrap}>
          <Pressable
            style={styles.moreBtn}
            accessibilityRole="button"
            accessibilityLabel={`More options for ${member.name}`}
            hitSlop={8}
          >
            <Feather name="more-horizontal" size={18} color={mutedColor} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function TeamAccess() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = MEMBERS.filter(
    (m) =>
      search.length === 0 ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>All Members</Text>
        <Pressable style={styles.plusBtn} accessibilityRole="button" accessibilityLabel="Add member">
          <Feather name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab, i) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(i)}
            style={[styles.tab, i === activeTab && styles.tabActive]}
          >
            <Text style={[styles.tabText, i === activeTab && styles.tabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={colors.mutedForeground} style={{ flexShrink: 0 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search anything ..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          <Pressable style={styles.filterBtn} accessibilityLabel="Filter">
            <Feather name="sliders" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((member) => (
          <MemberCard key={member.id} member={member} styles={styles} mutedColor={colors.mutedForeground} />
        ))}
        {filtered.length === 0 && (
          <Text style={styles.emptyText}>No members match "{search}"</Text>
        )}
      </ScrollView>
    </View>
  );
}
