import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
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
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  interpolate,
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
const MAX_SELECTED_IMAGES = 20;

type SelectedGalleryImage = {
  id: string;
  uri: string;
  label: string;
};

type GallerySlots = (SelectedGalleryImage | undefined)[];

type GalleryState = {
  heroTitle: string;
  imageCount: number;
};

function GalleryRow({
  number,
  index,
  colors,
  reduceMotion,
  image,
  onOpenActions,
}: {
  number: number;
  index: number;
  colors: ThemePalette;
  reduceMotion: boolean;
  image?: SelectedGalleryImage;
  onOpenActions: () => void;
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
      <View style={styles.imageThumb} accessibilityLabel={image?.label ?? `Image placeholder ${number}`}>
        {image ? (
          <Image
            source={{ uri: image.uri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityLabel={image.label}
          />
        ) : (
          <>
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
          </>
        )}
      </View>

      <Text style={[styles.imageLabel, { color: colors.foreground }]}>
        {image?.label ?? `Image no ${number}`}
      </Text>

      <Pressable
        onPress={onOpenActions}
        style={styles.editButton}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Edit options for image ${number}`}
        testID={`gallery-row-edit-${number}`}
      >
        <Feather name="edit-2" size={16} color="#AEB4BA" />
      </Pressable>
    </Animated.View>
  );
}

function GalleryImageActionSheet({
  visible,
  rowNumber,
  hasImage,
  onClose,
  onEdit,
  onDelete,
}: {
  visible: boolean;
  rowNumber: number;
  hasImage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.actionModalRoot}>
        <Pressable
          style={styles.actionModalBackdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close image options"
        />
        <View style={styles.actionSheet} accessibilityViewIsModal>
          <View style={styles.actionSheetHandle} />
          <Text style={styles.actionSheetTitle}>Image no {rowNumber}</Text>
          <Text style={styles.actionSheetSubtitle}>
            {hasImage ? 'Update or remove this gallery image' : 'Add an image to this gallery slot'}
          </Text>

          <Pressable
            onPress={onEdit}
            style={({ pressed }) => [styles.actionOption, pressed && styles.actionOptionPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Edit image ${rowNumber}`}
            testID={`gallery-row-edit-option-${rowNumber}`}
          >
            <View style={styles.actionOptionIcon}>
              <Feather name="edit-2" size={17} color="#FFFFFF" />
            </View>
            <Text style={styles.actionOptionText}>Edit</Text>
            <Feather name="chevron-right" size={18} color="#8A8A8E" />
          </Pressable>

          <Pressable
            onPress={onDelete}
            disabled={!hasImage}
            style={({ pressed }) => [
              styles.actionOption,
              styles.deleteOption,
              pressed && styles.actionOptionPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Delete image ${rowNumber}`}
            accessibilityState={{ disabled: !hasImage }}
            testID={`gallery-row-delete-option-${rowNumber}`}
          >
            <View style={[styles.actionOptionIcon, styles.deleteOptionIcon]}>
              <Feather name="trash-2" size={17} color="#FFFFFF" />
            </View>
            <Text style={[styles.actionOptionText, styles.deleteOptionText]}>Delete</Text>
            <Feather name="chevron-right" size={18} color="#8A8A8E" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function LiquidGlassLayers() {
  return (
    <>
      <BlurView
        intensity={36}
        tint="dark"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.045)', 'rgba(255,255,255,0.12)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.92, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.065)']}
        locations={[0, 0.42, 1]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.82, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.glassNoise} pointerEvents="none" />
    </>
  );
}

function GalleryActionButtons({
  onPress,
  onAddImages,
  saved,
  saving,
}: {
  onPress: () => void;
  onAddImages: () => Promise<void>;
  saved: boolean;
  saving: boolean;
}) {
  const pressedProgress = useSharedValue(0);
  const plusPressedProgress = useSharedValue(0);
  const plusRotationProgress = useSharedValue(0);
  const saveHoverProgress = useSharedValue(0);
  const plusHoverProgress = useSharedValue(0);
  const savedProgress = useSharedValue(saved ? 1 : 0);
  const reduceMotion = useReducedMotion();
  const [saveFocused, setSaveFocused] = useState(false);
  const [plusFocused, setPlusFocused] = useState(false);
  const [picking, setPicking] = useState(false);

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

  const saveButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressedProgress.value * 0.03 }],
  }));

  const plusButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - plusPressedProgress.value * 0.03 }],
  }));

  const plusIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(plusRotationProgress.value, [0, 1], [0, 45])}deg` }],
  }));

  const saveHoverStyle = useAnimatedStyle(() => ({
    opacity: saveHoverProgress.value * 0.16,
  }));

  const plusHoverStyle = useAnimatedStyle(() => ({
    opacity: plusHoverProgress.value * 0.16,
  }));

  const saveReflectionStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + saveHoverProgress.value * 0.16,
    transform: [{ translateX: saveHoverProgress.value * 12 }],
  }));

  const plusReflectionStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + plusHoverProgress.value * 0.16,
    transform: [{ translateX: plusHoverProgress.value * 8 }],
  }));

  const savedGlowStyle = useAnimatedStyle(() => ({
    opacity: savedProgress.value * 0.3,
    transform: [{ scale: 1 + savedProgress.value * 0.08 }],
  }));

  const handleAddImages = useCallback(async () => {
    if (picking) return;
    setPicking(true);
    plusRotationProgress.value = withTiming(1, { duration: 220 });
    try {
      await onAddImages();
    } finally {
      plusRotationProgress.value = withTiming(0, { duration: 180 });
      setPicking(false);
    }
  }, [onAddImages, picking, plusRotationProgress]);

  const handlePlusKeyDown = useCallback((event: { key: string; preventDefault?: () => void }) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault?.();
      void handleAddImages();
    }
  }, [handleAddImages]);

  return (
    <View style={styles.actionGroup}>
      <View style={styles.saveActionWrap}>
        <Animated.View style={[styles.actionGlow, savedGlowStyle]} pointerEvents="none" />
        <Pressable
          onPress={onPress}
          onPressIn={() => {
            pressedProgress.value = reduceMotion
              ? withTiming(1, { duration: 80 })
              : withSpring(1, { damping: 18, stiffness: 300 });
          }}
          onPressOut={() => {
            pressedProgress.value = reduceMotion
              ? withTiming(0, { duration: 80 })
              : withSpring(0, { damping: 18, stiffness: 300 });
          }}
          onHoverIn={() => {
            saveHoverProgress.value = withTiming(1, { duration: 220 });
          }}
          onHoverOut={() => {
            saveHoverProgress.value = withTiming(0, { duration: 220 });
          }}
          onFocus={() => setSaveFocused(true)}
          onBlur={() => setSaveFocused(false)}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Gallery applied' : 'Save and apply gallery'}
          accessibilityState={{ busy: saving, disabled: saving }}
          testID="gallery-save-apply"
        >
          <Animated.View
            style={[
              styles.glassButton,
              styles.saveButton,
              saveButtonStyle,
              saveFocused && styles.glassButtonFocused,
              saving && styles.glassButtonDisabled,
            ]}
          >
            <LiquidGlassLayers />
            <Animated.View style={[styles.hoverWash, saveHoverStyle]} pointerEvents="none" />
            <Animated.View style={[styles.glassReflection, saveReflectionStyle]} pointerEvents="none">
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.13)', 'rgba(255,255,255,0)']}
                locations={[0, 0.5, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <Text style={styles.saveButtonText}>
              {saved ? 'Applied' : saving ? 'Applying…' : 'Save & Apply'}
            </Text>
          </Animated.View>
        </Pressable>
      </View>

      <Pressable
        onPress={() => {
          void handleAddImages();
        }}
        onPressIn={() => {
          plusPressedProgress.value = reduceMotion
            ? withTiming(1, { duration: 80 })
            : withSpring(1, { damping: 18, stiffness: 300 });
        }}
        onPressOut={() => {
          plusPressedProgress.value = reduceMotion
            ? withTiming(0, { duration: 80 })
            : withSpring(0, { damping: 18, stiffness: 300 });
        }}
        onHoverIn={() => {
          plusHoverProgress.value = withTiming(1, { duration: 220 });
        }}
        onHoverOut={() => {
          plusHoverProgress.value = withTiming(0, { duration: 220 });
        }}
        onFocus={() => setPlusFocused(true)}
        onBlur={() => setPlusFocused(false)}
        {...(Platform.OS === 'web'
          ? {
              tabIndex: 0,
              onKeyDown: handlePlusKeyDown,
            }
          : {})}
        disabled={picking}
        accessibilityRole="button"
        accessibilityLabel="Add images from gallery"
        accessibilityState={{ busy: picking, disabled: picking }}
        testID="gallery-add-image"
      >
        <Animated.View
          style={[
            styles.glassButton,
            styles.plusButton,
            plusButtonStyle,
            plusFocused && styles.glassButtonFocused,
            picking && styles.glassButtonDisabled,
          ]}
        >
          <LiquidGlassLayers />
          <Animated.View style={[styles.hoverWash, plusHoverStyle]} pointerEvents="none" />
          <Animated.View style={[styles.glassReflection, plusReflectionStyle]} pointerEvents="none">
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.13)', 'rgba(255,255,255,0)']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.View style={plusIconStyle}>
            <Feather name="plus" size={22} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </View>
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
  const [galleryImages, setGalleryImages] = useState<GallerySlots>([]);
  const [actionRow, setActionRow] = useState<number | null>(null);
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

  const addGalleryImages = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_SELECTED_IMAGES,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    setGalleryImages((current) => {
      const next = [...current];
      const existingUris = new Set(
        current.filter((image): image is SelectedGalleryImage => Boolean(image)).map((image) => image.uri),
      );
      const emptySlots = next
        .map((image, index) => (image ? -1 : index))
        .filter((index) => index >= 0);

      result.assets
        .filter((asset) => !existingUris.has(asset.uri))
        .slice(0, MAX_SELECTED_IMAGES - current.filter(Boolean).length)
        .forEach((asset, assetIndex) => {
          const targetIndex = emptySlots[assetIndex] ?? next.length;
          if (targetIndex >= MAX_SELECTED_IMAGES) return;
          next[targetIndex] = {
            id: `${asset.uri}-${targetIndex}`,
            uri: asset.uri,
            label: `Image no ${targetIndex + 1}`,
          };
        });

      return next.slice(0, MAX_SELECTED_IMAGES);
    });
  }, []);

  const editGalleryImage = useCallback(async (rowNumber: number) => {
    setActionRow(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      selectionLimit: 1,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const slotIndex = rowNumber - 1;
    setGalleryImages((current) => {
      const next = [...current];
      next[slotIndex] = {
        id: `${asset.uri}-${slotIndex}`,
        uri: asset.uri,
        label: `Image no ${rowNumber}`,
      };
      return next.slice(0, MAX_SELECTED_IMAGES);
    });
  }, []);

  const deleteGalleryImage = useCallback(() => {
    if (actionRow === null) return;

    setGalleryImages((current) => {
      const next = [...current];
      next[actionRow - 1] = undefined;
      while (next.length > IMAGE_SLOTS.length && !next[next.length - 1]) {
        next.pop();
      }
      return next;
    });
    setActionRow(null);
  }, [actionRow]);

  const galleryRows = useMemo(
    () => Array.from(
      { length: Math.max(IMAGE_SLOTS.length, galleryImages.length) },
      (_, index) => ({
        number: index + 1,
        image: galleryImages[index],
      }),
    ),
    [galleryImages],
  );

  if (!loaded) return null;

  return (
    <View style={[styles.root, stylesForTheme.root]}>
      <StatusBar
        barStyle={resolvedTheme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      <Animated.View style={[styles.screen, pageStyle]}>
        <View style={styles.heroPanel}>
          <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.backButton, styles.lightBackButton]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
            >
              <Feather name="arrow-left" size={21} color="#18181B" />
            </Pressable>
            <Text style={[styles.headerTitle, styles.lightHeaderTitle]}>Gallery</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.heroPanelContent}>
            <Text style={styles.heroSectionLabel}>FEATURED IMAGE</Text>
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
          </View>
        </View>

        <ScrollView
          style={styles.galleryScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.galleryContent,
            { paddingBottom: insets.bottom + 112 },
          ]}
        >
          <View style={styles.divider} />
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>GALLERY IMAGES</Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              {galleryImages.filter(Boolean).length > 0
                ? `${galleryImages.filter(Boolean).length} selected`
                : '4 slots'}
            </Text>
          </View>

          <View style={styles.imageList}>
            {galleryRows.map(({ number, image }, index) => (
              <GalleryRow
                key={image?.id ?? `placeholder-${number}`}
                number={number}
                index={index}
                colors={colors}
                reduceMotion={reduceMotion}
                image={image}
                onOpenActions={() => setActionRow(number)}
              />
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: insets.bottom + 16,
              backgroundColor: 'transparent',
              borderTopColor: 'transparent',
            },
          ]}
        >
          <GalleryActionButtons
            onPress={saveGallery}
            onAddImages={addGalleryImages}
            saved={saved}
            saving={saving}
          />
        </View>

        <GalleryImageActionSheet
          visible={actionRow !== null}
          rowNumber={actionRow ?? 1}
          hasImage={actionRow !== null && Boolean(galleryImages[actionRow - 1])}
          onClose={() => setActionRow(null)}
          onEdit={() => {
            if (actionRow !== null) void editGalleryImage(actionRow);
          }}
          onDelete={deleteGalleryImage}
        />
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
  heroPanel: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
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
  lightBackButton: {
    backgroundColor: '#F1F1F3',
    borderColor: '#E4E4E7',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 13,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  lightHeaderTitle: {
    color: '#18181B',
  },
  headerSpacer: {
    width: 38,
  },
  heroPanelContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 10,
  },
  galleryScroll: {
    flex: 1,
  },
  galleryContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    gap: 12,
  },
  heroBox: {
    minHeight: 96,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 15,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
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
  heroSectionLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 2,
    marginTop: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#343638',
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
  editButton: {
    width: 34,
    height: 34,
    marginLeft: 'auto',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
  actionModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  actionSheet: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#1B1C1C',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.13)',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  actionSheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    marginBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  actionSheetTitle: {
    color: '#F5F5F5',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  actionSheetSubtitle: {
    color: '#8A8A8E',
    fontSize: 12,
    marginTop: 5,
    marginBottom: 18,
  },
  actionOption: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#252627',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionOptionPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
  actionOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
  },
  actionOptionText: {
    flex: 1,
    color: '#F5F5F5',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteOption: {
    marginTop: 10,
  },
  deleteOptionIcon: {
    backgroundColor: '#B4232F',
  },
  deleteOptionText: {
    color: '#FFB8BE',
  },
  bottomBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  actionGroup: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveActionWrap: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },
  actionGlow: {
    position: 'absolute',
    top: -3,
    right: -3,
    bottom: -3,
    left: -3,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  glassButton: {
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(40,42,45,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  saveButton: {
    width: '100%',
    height: 46,
    paddingHorizontal: 18,
  },
  plusButton: {
    width: 46,
    height: 46,
  },
  glassButtonFocused: {
    borderColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.38,
    shadowRadius: 11,
    elevation: 6,
  },
  glassButtonDisabled: {
    opacity: 0.55,
  },
  glassNoise: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.035)',
    opacity: 0.65,
  },
  hoverWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  glassReflection: {
    position: 'absolute',
    top: -16,
    left: -38,
    width: 36,
    height: 82,
    borderRadius: 24,
    overflow: 'hidden',
    transform: [{ rotate: '18deg' }],
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

const createThemeStyles = (colors: ThemePalette) =>
  StyleSheet.create({
    root: {
      backgroundColor: colors.background,
    },
  });