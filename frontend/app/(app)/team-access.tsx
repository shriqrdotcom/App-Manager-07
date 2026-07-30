import React, { useState } from 'react';
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

// ─── Colours (copied from reference image) ───────────────────────────────────
const C = {
  bg:           '#000000',
  card:         '#1A1A1A',
  cardBorder:   '#2A2A2A',
  textPrimary:  '#FFFFFF',
  textSub:      '#888888',
  textMuted:    '#555555',
  searchBg:     '#111111',
  searchBorder: '#2A2A2A',
  tabActiveBg:  '#FFFFFF',
  tabActiveText:'#000000',
  tabInactiveText: '#888888',
  plusBtn:      '#9B8FD4',
  badgeReviewed:    '#D8FF6E',   // soft lime-yellow (light)
  badgeReviewedText:'#1A1A00',
  badgeVerified:    '#C4B5FD',   // soft lavender (light)
  badgeVerifiedText:'#1A004A',
  badgeNeeds:       '#67E8F9',   // soft cyan (light)
  badgeNeedsText:   '#001A1E',
  divider:      '#242424',
};

// ─── Mock data ────────────────────────────────────────────────────────────────
type Status = 'Reviewed' | 'Verified' | 'Needs Update';

type Member = {
  id: string;
  name: string;
  role: string;
  country: string;
  group: string;
  workType: string;
  status: Status;
  initials: string;
  avatarColor: string;
};

const MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Daniel Carter',
    role: 'Product Designer',
    country: 'Indonesia',
    group: 'Appspace',
    workType: 'Employee',
    status: 'Reviewed',
    initials: 'DC',
    avatarColor: '#5B4A3F',
  },
  {
    id: '2',
    name: 'Aisha Patel',
    role: 'HR Specialist',
    country: 'India',
    group: 'Appspace',
    workType: 'Employee',
    status: 'Verified',
    initials: 'AP',
    avatarColor: '#3D3D4F',
  },
  {
    id: '3',
    name: 'Noah Bennett',
    role: 'Data Analyst',
    country: 'Singapore',
    group: 'Appspace',
    workType: 'Employee',
    status: 'Needs Update',
    initials: 'NB',
    avatarColor: '#2E3D3A',
  },
  {
    id: '4',
    name: 'Isabella Flores',
    role: 'Marketing Lead',
    country: 'Mexico',
    group: 'Appspace',
    workType: 'Employee',
    status: 'Reviewed',
    initials: 'IF',
    avatarColor: '#4A3A2A',
  },
  {
    id: '5',
    name: 'Liam Thompson',
    role: 'Backend Engineer',
    country: 'Australia',
    group: 'Appspace',
    workType: 'Contractor',
    status: 'Verified',
    initials: 'LT',
    avatarColor: '#1E3A4A',
  },
  {
    id: '6',
    name: 'Priya Sharma',
    role: 'UX Researcher',
    country: 'India',
    group: 'Appspace',
    workType: 'Employee',
    status: 'Needs Update',
    initials: 'PS',
    avatarColor: '#3A1E4A',
  },
];

const TABS = ['All members', 'Organization', 'Activity', 'Reports'];

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  let bg: string;
  let fg: string;

  if (status === 'Reviewed') {
    bg = C.badgeReviewed;
    fg = C.badgeReviewedText;
  } else if (status === 'Verified') {
    bg = C.badgeVerified;
    fg = C.badgeVerifiedText;
  } else {
    bg = C.badgeNeeds;
    fg = C.badgeNeedsText;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{status}</Text>
    </View>
  );
}

// ─── Avatar initials ──────────────────────────────────────────────────────────
function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────
function MemberCard({ member }: { member: Member }) {
  return (
    <View style={styles.card}>
      {/* Top row: avatar + name/role + badge */}
      <View style={styles.cardTop}>
        <Avatar initials={member.initials} color={member.avatarColor} />
        <View style={styles.cardInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberRole}>{member.role}</Text>
        </View>
        <StatusBadge status={member.status} />
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Bottom row: country / group / work type */}
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>{member.country}</Text>
          <Text style={styles.metaLabel}>Country</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>{member.group}</Text>
          <Text style={styles.metaLabel}>Group name</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>{member.workType}</Text>
          <Text style={styles.metaLabel}>Work type</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function TeamAccess() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = MEMBERS.filter((m) =>
    search.length === 0 ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Feather name="arrow-left" size={24} color={C.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>All Members</Text>
        <Pressable style={styles.plusBtn} accessibilityRole="button" accessibilityLabel="Add member">
          <Feather name="plus" size={20} color={C.textPrimary} />
        </Pressable>
      </View>

      {/* ── Tab bar ── */}
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

      {/* ── Search ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color={C.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search anything ..."
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          <Pressable style={styles.filterBtn} accessibilityLabel="Filter">
            <Feather name="sliders" size={16} color={C.textSub} />
          </Pressable>
        </View>
      </View>

      {/* ── List ── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
        {filtered.length === 0 && (
          <Text style={styles.emptyText}>No members match "{search}"</Text>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
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
    color: C.textPrimary,
    letterSpacing: -0.5,
  },
  plusBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.plusBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
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
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tabActive: {
    backgroundColor: C.tabActiveBg,
    borderColor: C.tabActiveBg,
  },
  tabText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: C.tabInactiveText,
  },
  tabTextActive: {
    color: C.tabActiveText,
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
    backgroundColor: C.searchBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.searchBorder,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
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
    color: C.textSub,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
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
    color: C.textPrimary,
  },
  memberRole: {
    fontSize: 12.5,
    color: C.textSub,
    marginTop: 2,
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

  // Card divider
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.divider,
    marginBottom: 12,
  },

  // Meta row
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
  },
  metaLabel: {
    fontSize: 11,
    color: C.textSub,
    marginTop: 2,
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
    color: C.textPrimary,
  },
});
