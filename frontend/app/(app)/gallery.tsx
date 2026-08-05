import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, type ThemePalette } from '@/src/providers/ThemeProvider';
import { storage } from '@/src/utils/storage';

const STORAGE_KEY = 'restaurant_gallery_layout_v1';
const IMAGE_SLOTS = [1, 2, 3, 4];

type GalleryState = {
  heroTitle: string;
  imageCount: number;
};

function GalleryRow({
  number,
  index,
  colors,
  reduceMotion,
}: {
  number: number;
  index: number;
  colors: ThemePalette;
  reduceMotion: boolean;
}) {
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    progress.value = reduceMotion
      ? 1
      : withDelay(index * 65, withTiming(1, { duration: 260 }));
  }, [index, progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 12 }],
  }));

  return (
    <Animated.View style={[styles.imageRow, { backgroundColor: colors.card, borderColor: colors.border }, animatedStyle]}>
      <View style={styles.imageThumb} accessibilityLabel={`Image placeholder ${number}`}>
        <LinearGradient
          colors={['#F7F7F7', '#DADDE0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.thumbFrame}>
          <View style={styles.thumbSun} />
          <View style={styles.thumbMountainOne} />
          <View style={styles.thumbMountainTwo} />
        </View>
        <Feather name="image" size={15} color="#6E747B" />
      </View>

      <Text style={[styles.imageLabel, { color: colors.foreground }]}>
        Image no {number}
      </Text>
    </Animated.View>
  );
}

function GallerySaveButton({
  onPress,
  saved,
  saving,
}: {
  onPress: () => void;
  saved: boolean;
  saving: boolean;
}) {
  const pressedProgress = useSharedValue(0);
  const savedProgress = useSharedValue(saved ? 1 : 0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      savedProgress.value = saved ? 1 : 0;
      return;
    }

    savedProgress.value = saved
      ? withSequence(
          withTiming(1, { duration: 160 }),
          withTiming(0.92, { duration: 100 }),
          withTiming(1, { duration: 180 }),
        )
      : withTiming(0, { duration: 160 });
  }, [reduceMotion, saved, savedProgress]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - pressedProgress.value * 0.025 },
      { scale: 1 + savedProgress.value * 0.018 },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: savedProgress.value * 0.32,
    transform: [{ scale: 1 + savedProgress.value * 0.1 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressedProgress.value = withSpring(1, { damping: 18, stiffness: 300 });
      }}
      onPressOut={() => {
        pressedProgress.value = withSpring(0, { damping: 18, stiffness: 300 });
      }}
      disabled={saving}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Gallery applied' : 'Save and apply gallery'}
      accessibilityState={{ busy: saving, disabled: saving }}
      testID="gallery-save-apply"
    >
      <Animated.View style={[styles.saveGlow, glowStyle]} pointerEvents="none" />
      <Animated.View style={[styles.saveButton, buttonStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.045)', 'rgba(255,255,255,0.11)']}
          locations={[0, 0.52, 1]}
          start={{ x: 0.08, y: 0 }}
          end={{ x: 0.92, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.saveButtonText}>
          {saved ? 'Applied' : saving ? 'Applying…' : 'Save & Apply'}
        </Text>
        <View style={styles.saveButtonIcon}>
          <Feather name={saved ? 'check' : 'plus'} size={21} color="#FFFFFF" />
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function Gallery() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resolvedTheme, colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const stylesForTheme = useMemo(() => createThemeStyles(colors), [colors]);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageProgress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    void storage.getItem<GalleryState | null>(STORAGE_KEY, null).then(() => {
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    pageProgress.value = reduceMotion
      ? 1
      : withTiming(1, { duration: 360 });
  }, [pageProgress, reduceMotion]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const pageStyle = useAnimatedStyle(() => ({
    opacity: pageProgress.value,
    transform: [{ translateY: (1 - pageProgress.value) * 14 }],
  }));

  const saveGallery = useCallback(async () => {
    if (saving) return;
    setSaving(true);

    await storage.setItem<GalleryState>(STORAGE_KEY, {
      heroTitle: 'Gallery',
      imageCount: IMAGE_SLOTS.length,
    });

    setSaving(false);
    setSaved(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
      setSaved(false);
      resetTimer.current = null;
    }, 1500);
  }, [saving]);

  if (!loaded) return null;

  return (
    <View style={[styles.root, stylesForTheme.root]}>
      <StatusBar
        barStyle={resolvedTheme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      <Animated.View style={[styles.screen, pageStyle]}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
          >
            <Feather name="arrow-left" size={21} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Gallery</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 112 },
          ]}
        >
          <View style={[styles.heroBox, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroIcon}>
                <Feather name="image" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>Gallery</Text>
                <Text style={styles.heroSubtitle}>Your public image collection</Text>
              </View>
              <View style={styles.heroStatus}>
                <View style={styles.heroStatusDot} />
                <Text style={styles.heroStatusText}>LIVE</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FEATURED IMAGE</Text>
          <View style={styles.mapCard} accessibilityLabel="Featured gallery image preview">
            <View style={styles.mapTexture} />
            <View style={[styles.mapRoad, styles.mapRoadOne]} />
            <View style={[styles.mapRoad, styles.mapRoadTwo]} />
            <View style={[styles.mapRoad, styles.mapRoadThree]} />
            <View style={[styles.mapBlock, styles.mapBlockOne]} />
            <View style={[styles.mapBlock, styles.mapBlockTwo]} />
            <View style={[styles.mapBlock, styles.mapBlockThree]} />
            <View style={styles.featuredImageShape}>
              <Feather name="image" size={25} color="#A9B0B7" />
            </View>
            <Text style={styles.featuredLabel}>Gallery cover</Text>
          </View>

          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>GALLERY IMAGES</Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>4 slots</Text>
          </View>

          <View style={styles.imageList}>
            {IMAGE_SLOTS.map((number, index) => (
              <GalleryRow
                key={number}
                number={number}
                index={index}
                colors={colors}
                reduceMotion={reduceMotion}
              />
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: insets.bottom + 16,
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <GallerySaveButton onPress={saveGallery} saved={saved} saving={saving} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 13,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 38,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 12,
  },
  heroBox: {
    minHeight: 96,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 15,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22262B',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: '#18181B',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  heroSubtitle: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 4,
  },
  heroStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  heroStatusText: {
    color: '#71717A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 2,
    marginTop: 4,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionHint: {
    fontSize: 11,
    marginRight: 2,
  },
  mapCard: {
    height: 188,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#25282C',
    borderWidth: 1,
    borderColor: '#353A40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.25,
    backgroundColor: '#17191C',
  },
  mapRoad: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#4A4F55',
    opacity: 0.62,
  },
  mapRoadOne: {
    width: '125%',
    top: '37%',
    left: '-12%',
    transform: [{ rotate: '-24deg' }],
  },
  mapRoadTwo: {
    width: '130%',
    top: '70%',
    left: '-16%',
    transform: [{ rotate: '20deg' }],
  },
  mapRoadThree: {
    width: '94%',
    top: '45%',
    left: '14%',
    transform: [{ rotate: '78deg' }],
  },
  mapBlock: {
    position: 'absolute',
    borderRadius: 5,
    backgroundColor: '#3C4147',
    opacity: 0.6,
  },
  mapBlockOne: {
    width: 76,
    height: 38,
    top: 26,
    left: 22,
    transform: [{ rotate: '-12deg' }],
  },
  mapBlockTwo: {
    width: 52,
    height: 72,
    top: 92,
    right: 25,
    transform: [{ rotate: '23deg' }],
  },
  mapBlockThree: {
    width: 86,
    height: 34,
    bottom: 20,
    left: 44,
    transform: [{ rotate: '14deg' }],
  },
  featuredImageShape: {
    width: 78,
    height: 62,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  featuredLabel: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 9,
  },
  imageList: {
    gap: 8,
  },
  imageRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
  },
  imageThumb: {
    width: 68,
    height: 56,
    overflow: 'hidden',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  thumbFrame: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  thumbSun: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    right: 9,
    top: 9,
    backgroundColor: '#A7B0B8',
  },
  thumbMountainOne: {
    position: 'absolute',
    width: 58,
    height: 34,
    left: -5,
    bottom: -20,
    transform: [{ rotate: '32deg' }],
    backgroundColor: '#B8BEC4',
  },
  thumbMountainTwo: {
    position: 'absolute',
    width: 52,
    height: 29,
    right: -8,
    bottom: -17,
    transform: [{ rotate: '-27deg' }],
    backgroundColor: '#9299A1',
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  saveGlow: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    left: 8,
    height: 58,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.8,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  saveButton: {
    minHeight: 58,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 22,
    borderRadius: 30,
    backgroundColor: '#242629',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#000000',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.25,
  },
  saveButtonIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
});

const createThemeStyles = (colors: ThemePalette) =>
  StyleSheet.create({
    root: {
      backgroundColor: colors.background,
    },
  });