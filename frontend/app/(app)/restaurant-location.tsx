import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme, type ThemePalette } from '@/src/providers/ThemeProvider';

const DEFAULT_LOCATION = 'Bandra West';

export default function RestaurantLocation() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resolvedTheme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [location, setLocation] = useState(DEFAULT_LOCATION);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={resolvedTheme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={colors.background}
      />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <Feather name="arrow-left" size={21} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Restaurant Location</Text>
          <Text style={styles.headerSubtitle}>
            Configure where customers can generate social tokens.
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 112 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>RESTAURANT ADDRESS</Text>
        <View style={styles.addressField}>
          <Feather name="map-pin" size={18} color={colors.foreground} />
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Enter your restaurant location"
            placeholderTextColor={colors.mutedForeground}
            style={styles.addressInput}
            accessibilityLabel="Restaurant address"
          />
          <Pressable
            style={styles.editButton}
            accessibilityRole="button"
            accessibilityLabel="Edit restaurant address"
          >
            <Feather name="edit-2" size={16} color={colors.foreground} />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.rangeCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Set location range"
        >
          <View style={styles.rangeIcon}>
            <Feather name="crosshair" size={23} color="#FFFFFF" />
          </View>
          <View style={styles.rangeCopy}>
            <Text style={styles.rangeTitle}>Set Location Range</Text>
            <Text style={styles.rangeSubtitle}>
              Choose the area where QR code scans can generate social tokens.
            </Text>
          </View>
          <Feather name="chevron-right" size={21} color="#FFFFFF" />
        </Pressable>

        <RangePreview styles={styles} />

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Feather name="shield" size={18} color={colors.foreground} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>How Social Tokens Work</Text>
            <Text style={styles.infoDescription}>
              Customers must scan your restaurant QR code while inside the selected
              location range. If they are outside the range, no social token will be generated.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Save location and range"
        >
          <Text style={styles.saveButtonText}>Save Location &amp; Range</Text>
          <Feather name="shield" size={17} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function RangePreview({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.mapCard} accessibilityLabel="Static 500 meter location range preview">
      <View style={styles.mapGrid} />
      <View style={[styles.mapRoad, styles.mapRoadOne]} />
      <View style={[styles.mapRoad, styles.mapRoadTwo]} />
      <View style={[styles.mapRoad, styles.mapRoadThree]} />
      <View style={[styles.mapBlock, styles.mapBlockOne]} />
      <View style={[styles.mapBlock, styles.mapBlockTwo]} />
      <View style={[styles.mapBlock, styles.mapBlockThree]} />
      <View style={styles.radiusCircle} />
      <View style={styles.radiusLine} />
      <View style={styles.radiusHandle} />
      <View style={styles.mapPin}>
        <Feather name="map-pin" size={25} color="#18202B" />
      </View>
      <View style={styles.radiusLabel}>
        <Text style={styles.radiusLabelText}>500 m</Text>
      </View>
      <View style={styles.pinBase} />
    </View>
  );
}

const createStyles = (colors: ThemePalette) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerCopy: {
    flex: 1,
    paddingTop: 2,
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
    gap: 12,
  },
  sectionLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginLeft: 2,
    marginTop: 4,
  },
  addressField: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressInput: {
    flex: 1,
    color: colors.foreground,
    fontSize: 14,
    paddingHorizontal: 11,
    paddingVertical: 14,
  },
  editButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeCard: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 19,
    backgroundColor: '#18202B',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  rangeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  rangeCopy: {
    flex: 1,
  },
  rangeTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  rangeSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    lineHeight: 16,
  },
  mapCard: {
    height: 292,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapRoad: {
    position: 'absolute',
    height: 2,
    backgroundColor: colors.card,
    opacity: 0.88,
  },
  mapRoadOne: {
    width: '125%',
    top: '38%',
    left: '-10%',
    transform: [{ rotate: '-25deg' }],
  },
  mapRoadTwo: {
    width: '130%',
    top: '63%',
    left: '-16%',
    transform: [{ rotate: '21deg' }],
  },
  mapRoadThree: {
    width: '95%',
    top: '48%',
    left: '10%',
    transform: [{ rotate: '79deg' }],
  },
  mapBlock: {
    position: 'absolute',
    borderRadius: 4,
    backgroundColor: colors.card,
    opacity: 0.52,
  },
  mapBlockOne: {
    width: 60,
    height: 38,
    top: 30,
    left: 24,
    transform: [{ rotate: '-12deg' }],
  },
  mapBlockTwo: {
    width: 48,
    height: 70,
    top: 154,
    right: 28,
    transform: [{ rotate: '23deg' }],
  },
  mapBlockThree: {
    width: 82,
    height: 34,
    bottom: 22,
    left: 42,
    transform: [{ rotate: '14deg' }],
  },
  radiusCircle: {
    position: 'absolute',
    width: 188,
    height: 188,
    borderRadius: 94,
    left: '50%',
    top: '50%',
    marginLeft: -94,
    marginTop: -94,
    backgroundColor: 'rgba(160, 160, 160, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(110, 110, 110, 0.52)',
    borderStyle: 'dashed',
  },
  radiusLine: {
    position: 'absolute',
    width: 104,
    height: 1,
    top: '50%',
    left: '50%',
    backgroundColor: '#222A35',
  },
  radiusHandle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: '50%',
    left: '50%',
    marginLeft: 48,
    marginTop: -5,
    backgroundColor: '#18202B',
  },
  mapPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -13,
    marginTop: -27,
    width: 26,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBase: {
    position: 'absolute',
    width: 8,
    height: 4,
    borderRadius: 4,
    top: '50%',
    left: '50%',
    marginLeft: -4,
    marginTop: 10,
    backgroundColor: 'rgba(24,32,43,0.36)',
  },
  radiusLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: 52,
    marginTop: -28,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#18202B',
  },
  radiusLabelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  infoCopy: {
    flex: 1,
  },
  infoTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },
  infoDescription: {
    color: colors.mutedForeground,
    fontSize: 11.5,
    lineHeight: 17,
  },
  bottomBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 15,
    backgroundColor: '#18202B',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
});