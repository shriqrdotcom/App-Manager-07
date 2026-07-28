import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import colors from '@/src/constants/colors';
import { storage } from '@/src/utils/storage';

const STORAGE_KEY = 'theme_preference_v1';

type ThemeOption = 'light' | 'dark' | 'system';

const THEMES: {
  key: ThemeOption;
  label: string;
  desc: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}[] = [
  {
    key: 'dark',
    label: 'Dark',
    desc: 'Dark background, easy on the eyes at night',
    icon: 'moon',
    color: '#8B5CF6',
  },
  {
    key: 'light',
    label: 'Light',
    desc: 'Bright background, great in daylight',
    icon: 'sun',
    color: '#F59E0B',
  },
  {
    key: 'system',
    label: 'System default',
    desc: 'Follows your device appearance setting',
    icon: 'smartphone',
    color: '#3B82F6',
  },
];

function RadioDot({ selected }: { selected: boolean }) {
  const scale = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    scale.value = withTiming(selected ? 1 : 0, { duration: 180 });
  }, [selected]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.radioOuter}>
      <Animated.View style={[styles.radioDot, dotStyle]} />
    </View>
  );
}

export default function ThemeSettings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState<ThemeOption>('dark');

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem(STORAGE_KEY, null);
      if (saved && typeof saved === 'string' && ['light', 'dark', 'system'].includes(saved as string)) {
        setSelected(saved as ThemeOption);
      }
    })();
  }, []);

  const pick = (key: ThemeOption) => {
    setSelected(key);
    storage.setItem(STORAGE_KEY, key as unknown as Record<string, unknown>);
  };

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
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Theme</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview swatch */}
        <View style={styles.section}>
          <View style={styles.previewCard}>
            <View style={styles.previewDots}>
              <View style={[styles.previewDot, { backgroundColor: '#EF4444' }]} />
              <View style={[styles.previewDot, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.previewDot, { backgroundColor: '#22C55E' }]} />
            </View>
            <View style={styles.previewRow}>
              <View style={[styles.previewBar, { width: '55%', backgroundColor: colors.border }]} />
              <View style={[styles.previewBar, { width: '30%', backgroundColor: '#8B5CF6', opacity: 0.7 }]} />
            </View>
            <View style={styles.previewRow}>
              <View style={[styles.previewBar, { width: '40%', backgroundColor: colors.border }]} />
              <View style={[styles.previewBar, { width: '20%', backgroundColor: colors.border }]} />
            </View>
            <View style={styles.previewRow}>
              <View style={[styles.previewBar, { width: '65%', backgroundColor: colors.border }]} />
            </View>
            <Text style={styles.previewLabel}>
              {THEMES.find((t) => t.key === selected)?.label ?? 'Dark'}
            </Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APPEARANCE</Text>
          <View style={styles.card}>
            {THEMES.map((theme, i) => (
              <React.Fragment key={theme.key}>
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => pick(theme.key)}
                  accessible
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected === theme.key }}
                  accessibilityLabel={theme.label}
                >
                  <View style={[styles.iconBox, { backgroundColor: theme.color }]}>
                    <Feather name={theme.icon} size={14} color="#fff" />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{theme.label}</Text>
                    <Text style={styles.rowDesc}>{theme.desc}</Text>
                  </View>
                  <RadioDot selected={selected === theme.key} />
                </Pressable>
                {i < THEMES.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Info note */}
        <View style={styles.section}>
          <View style={styles.noteCard}>
            <Feather name="info" size={13} color={colors.info} />
            <Text style={styles.noteText}>
              Theme changes will take effect the next time you open the app.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    flex: 1,
  },

  scroll: {
    paddingTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.mutedForeground,
    letterSpacing: 1,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  // Preview swatch
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 10,
  },
  previewDots: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 4,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  previewBar: {
    height: 8,
    borderRadius: 4,
    opacity: 0.5,
  },
  previewLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Option rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowPressed: {
    backgroundColor: colors.accent,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: { flex: 1 },
  rowLabel: {
    color: colors.foreground,
    fontSize: 14.5,
    fontWeight: '500',
  },
  rowDesc: {
    color: colors.mutedForeground,
    fontSize: 11.5,
    marginTop: 2,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 58,
  },

  // Radio button
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8B5CF6',
  },

  // Note
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  noteText: {
    flex: 1,
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
  },
});
