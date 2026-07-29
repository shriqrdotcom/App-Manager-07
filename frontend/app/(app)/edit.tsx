import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme, type ThemePalette } from '@/src/providers/ThemeProvider';
import staticColors from '@/src/constants/colors';
import { ScreenTitle, Card, SearchBar } from '@/src/components/ui';

type MenuItem = {
  id: string; name: string; category: string; price: number;
  veg: boolean; bestseller?: boolean; active: boolean; emoji: string;
};

type Combo = {
  id: string; name: string; items: string[]; price: number; oldPrice: number;
  active: boolean; emoji: string;
};

const INITIAL_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'Butter Chicken', category: 'Mains · North Indian', price: 480, veg: false, bestseller: true, active: true, emoji: '🍗' },
  { id: 'm2', name: 'Paneer Tikka Masala', category: 'Mains · North Indian', price: 420, veg: true, bestseller: true, active: true, emoji: '🧀' },
  { id: 'm3', name: 'Garlic Naan', category: 'Breads', price: 90, veg: true, active: true, emoji: '🥖' },
  { id: 'm4', name: 'Hyderabadi Biryani', category: 'Rice · Mains', price: 380, veg: false, active: true, emoji: '🍚' },
  { id: 'm5', name: 'Dal Makhani', category: 'Mains · North Indian', price: 320, veg: true, active: false, emoji: '🥘' },
  { id: 'm6', name: 'Mango Lassi', category: 'Beverages', price: 140, veg: true, active: true, emoji: '🥤' },
];

const INITIAL_COMBOS: Combo[] = [
  { id: 'c1', name: 'Family Feast', items: ['Butter Chicken', 'Naan Basket', 'Jeera Rice', 'Gulab Jamun (2)'], price: 1290, oldPrice: 1580, active: true, emoji: '🍱' },
  { id: 'c2', name: 'Veg Thali Deluxe', items: ['Paneer Tikka Masala', 'Dal Makhani', '3 Roti', 'Rice', 'Salad'], price: 620, oldPrice: 780, active: true, emoji: '🥗' },
  { id: 'c3', name: 'Biryani Bonanza', items: ['Chicken Biryani', 'Raita', 'Salan', 'Sweet'], price: 480, oldPrice: 590, active: false, emoji: '🍛' },
];

type StatusFilter = 'all' | 'active' | 'paused';
type MenuTab = 'items' | 'combos';

function makeStyles(colors: ThemePalette) {
  return StyleSheet.create({
    quickRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 14 },
    quickBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    quickBtnText: { color: colors.foreground, fontSize: 12.5, fontWeight: '600' },

    tabsWrap: { paddingHorizontal: 20, marginBottom: 12 },
    tabsRow: {
      flexDirection: 'row', backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 4,
    },
    tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    tabBtnActive: { backgroundColor: colors.primary },
    tabText: { color: colors.mutedForeground, fontSize: 13, fontWeight: '600' },

    statusRow: { flexDirection: 'row', paddingLeft: 20, paddingRight: 20, paddingTop: 4, paddingBottom: 12, gap: 8, alignItems: 'center' },
    statusChip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexShrink: 0,
    },
    statusChipText: { color: colors.mutedForeground, fontSize: 12.5, fontWeight: '600' },

    itemCard: { marginHorizontal: 20, flexDirection: 'row', gap: 12, alignItems: 'center' },
    imgWrap: {
      width: 64, height: 64, borderRadius: 12, backgroundColor: colors.muted,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
    },
    vegDot: {
      position: 'absolute', top: 4, left: 4, width: 10, height: 10, borderRadius: 5,
      borderWidth: 1.5, borderColor: colors.muted,
    },
    itemName: { color: colors.foreground, fontSize: 14.5, fontWeight: '700' },
    itemCategory: { color: colors.mutedForeground, fontSize: 12 },
    itemPrice: { color: colors.foreground, fontSize: 15, fontWeight: '800' },
    itemRight: { alignItems: 'flex-end', gap: 6 },
    badge: {
      flexDirection: 'row', alignItems: 'center', gap: 3,
      backgroundColor: '#F59E0B18', borderColor: '#F59E0B44', borderWidth: 1,
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999,
    },
    badgeText: { color: '#F5C577', fontSize: 9.5, fontWeight: '700' },
    statusDotPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    miniBtn: {
      width: 26, height: 26, borderRadius: 6, backgroundColor: colors.muted,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    },

    comboBanner: {
      width: '100%', height: 120, borderRadius: 12, overflow: 'hidden',
      backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center',
    },
    comboBannerOverlay: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingVertical: 8,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    comboBannerName: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
    oldPrice: { color: colors.mutedForeground, fontSize: 12, textDecorationLine: 'line-through' },
    saveBadge: { backgroundColor: '#22C55E22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    saveText: { color: '#4ADE80', fontSize: 10, fontWeight: '700' },
    ghostAction: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 9, borderRadius: 10, backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border,
    },
    ghostActionText: { color: colors.foreground, fontSize: 12.5, fontWeight: '600' },
    ghostActionDanger: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 9, borderRadius: 10, backgroundColor: '#3B1D1D', borderWidth: 1, borderColor: '#7F1D1D',
    },
    ghostActionDangerText: { color: staticColors.destructive, fontSize: 12.5, fontWeight: '600' },

    toast: {
      position: 'absolute', bottom: 24, alignSelf: 'center',
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10,
    },
    toastText: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
  });
}

type StylesType = ReturnType<typeof makeStyles>;

export default function EditMenu() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState<MenuTab>('items');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [combos, setCombos] = useState(INITIAL_COMBOS);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 1800); };

  const filteredItems = useMemo(() => items.filter((it) => {
    if (search && !it.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (status === 'active' && !it.active) return false;
    if (status === 'paused' && it.active) return false;
    return true;
  }), [items, search, status]);

  const filteredCombos = useMemo(() => combos.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (status === 'active' && !c.active) return false;
    if (status === 'paused' && c.active) return false;
    return true;
  }), [combos, search, status]);

  const toggleItem = (id: string) => {
    setItems((prev) => prev.map((it) => {
      if (it.id === id) {
        const next = { ...it, active: !it.active };
        showToast(`${it.name} ${next.active ? 'activated' : 'paused'}`);
        return next;
      }
      return it;
    }));
  };

  const toggleCombo = (id: string) => {
    setCombos((prev) => prev.map((c) => {
      if (c.id === id) {
        const next = { ...c, active: !c.active };
        showToast(`${c.name} ${next.active ? 'published' : 'paused'}`);
        return next;
      }
      return c;
    }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenTitle testID="edit-title">Edit Menu</ScreenTitle>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search dishes or combos" testID="edit-search" />

      {/* Quick actions */}
      <View style={styles.quickRow}>
        <QuickBtn icon="plus" label="Add item" testID="qa-add" styles={styles} />
        <QuickBtn icon="layers" label="Combos" testID="qa-combos" styles={styles} />
        <QuickBtn icon="tag" label="Categories" testID="qa-categories" styles={styles} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <View style={styles.tabsRow}>
          <TouchableOpacity style={[styles.tabBtn, tab === 'items' && styles.tabBtnActive]} onPress={() => setTab('items')} testID="edit-tab-items">
            <Text style={[styles.tabText, tab === 'items' && { color: colors.primaryForeground }]}>Menu items</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, tab === 'combos' && styles.tabBtnActive]} onPress={() => setTab('combos')} testID="edit-tab-combos">
            <Text style={[styles.tabText, tab === 'combos' && { color: colors.primaryForeground }]}>Combo offers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status filters */}
      <View style={styles.statusRow}>
        {(['all', 'active', 'paused'] as StatusFilter[]).map((s) => {
          const active = status === s;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setStatus(s)}
              testID={`edit-status-${s}`}
              style={[styles.statusChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <Text style={[styles.statusChipText, active && { color: colors.primaryForeground }]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === 'items' ? (
        <FlatList
          testID="edit-items-list"
          data={filteredItems}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => <ItemCard item={item} onToggle={() => toggleItem(item.id)} colors={colors} styles={styles} />}
          ListEmptyComponent={<EmptyState label="No items match your filters" colors={colors} />}
        />
      ) : (
        <FlatList
          testID="edit-combos-list"
          data={filteredCombos}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => <ComboCard combo={item} onToggle={() => toggleCombo(item.id)} onAction={showToast} colors={colors} styles={styles} />}
          ListEmptyComponent={<EmptyState label="No combos match your filters" colors={colors} />}
        />
      )}

      {toast && (
        <View style={styles.toast} testID="edit-toast">
          <Feather name="check-circle" size={14} color={staticColors.success} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

function EmptyState({ label, colors }: { label: string; colors: ThemePalette }) {
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingTop: 32 }}>
      <Feather name="package" size={26} color={colors.mutedForeground} />
      <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

function QuickBtn({ icon, label, testID, styles }: { icon: keyof typeof Feather.glyphMap; label: string; testID?: string; styles: StylesType }) {
  return (
    <TouchableOpacity style={styles.quickBtn} activeOpacity={0.8} testID={testID}>
      <Feather name={icon} size={14} color={staticColors.foreground} />
      <Text style={styles.quickBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function ItemCard({ item, onToggle, colors, styles }: { item: MenuItem; onToggle: () => void; colors: ThemePalette; styles: StylesType }) {
  return (
    <Card style={styles.itemCard} testID={`menu-item-${item.id}`}>
      <View style={styles.imgWrap}>
        <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
        <View style={[styles.vegDot, { backgroundColor: item.veg ? '#22C55E' : '#EF4444' }]} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          {item.bestseller && (
            <View style={styles.badge}>
              <Feather name="star" size={9} color="#F59E0B" />
              <Text style={styles.badgeText}>Bestseller</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemCategory} numberOfLines={1}>{item.category}</Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>
      <View style={styles.itemRight}>
        <View style={[styles.statusDotPill, { backgroundColor: item.active ? '#22C55E22' : '#8A8A8E22' }]}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: item.active ? '#4ADE80' : colors.mutedForeground }}>
            {item.active ? 'Active' : 'Paused'}
          </Text>
        </View>
        <Switch
          value={item.active}
          onValueChange={onToggle}
          trackColor={{ true: colors.primary, false: colors.accent }}
          thumbColor={item.active ? colors.primaryForeground : colors.mutedForeground}
          testID={`menu-toggle-${item.id}`}
        />
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity style={styles.miniBtn} testID={`menu-edit-${item.id}`}>
            <Feather name="edit-2" size={13} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.miniBtn} testID={`menu-more-${item.id}`}>
            <Feather name="more-vertical" size={13} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

function ComboCard({ combo, onToggle, onAction, colors, styles }: { combo: Combo; onToggle: () => void; onAction: (m: string) => void; colors: ThemePalette; styles: StylesType }) {
  const saving = combo.oldPrice - combo.price;
  return (
    <Card style={{ marginHorizontal: 20, gap: 0, overflow: 'hidden', padding: 0 }} testID={`combo-${combo.id}`}>
      {/* Full-width banner */}
      <View style={styles.comboBanner}>
        <Text style={{ fontSize: 56 }}>{combo.emoji}</Text>
        <View style={styles.comboBannerOverlay}>
          <Text style={styles.comboBannerName} numberOfLines={1}>{combo.name}</Text>
          <View style={[styles.statusDotPill, { backgroundColor: combo.active ? '#22C55E44' : '#8A8A8E33' }]}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: combo.active ? '#4ADE80' : '#aaa' }}>
              {combo.active ? 'Active' : 'Paused'}
            </Text>
          </View>
        </View>
      </View>

      {/* Info */}
      <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, gap: 6 }}>
        <Text style={styles.itemCategory} numberOfLines={2}>{combo.items.join(' · ')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={styles.itemPrice}>₹{combo.price}</Text>
          <Text style={styles.oldPrice}>₹{combo.oldPrice}</Text>
          <View style={styles.saveBadge}>
            <Text style={styles.saveText}>Save ₹{saving}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14, paddingTop: 6 }}>
        <TouchableOpacity style={styles.ghostAction} testID={`combo-edit-${combo.id}`}>
          <Feather name="edit-2" size={13} color={colors.foreground} />
          <Text style={styles.ghostActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostAction} onPress={onToggle} testID={`combo-toggle-${combo.id}`}>
          <Feather name={combo.active ? 'pause-circle' : 'play-circle'} size={13} color={colors.foreground} />
          <Text style={styles.ghostActionText}>{combo.active ? 'Pause' : 'Publish'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostActionDanger} onPress={() => onAction(`${combo.name} deleted`)} testID={`combo-delete-${combo.id}`}>
          <Feather name="trash-2" size={13} color={staticColors.destructive} />
          <Text style={styles.ghostActionDangerText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}
