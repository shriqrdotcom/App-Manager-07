import React, { useEffect, useMemo, useState } from 'react';
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
import { storage } from '@/src/utils/storage';

const STORAGE_KEY = 'restaurant_google_review_link_v1';

export default function GoogleReviewLink() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resolvedTheme, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    void storage.getItem(STORAGE_KEY, '').then((value) => {
      if (!active || typeof value !== 'string') return;
      setCurrentUrl(value);
      setUrlDraft(value);
    });

    return () => {
      active = false;
    };
  }, []);

  const isValidUrl = (value: string) => {
    try {
      const url = new URL(value.trim());
      return url.protocol === 'https:' && Boolean(url.hostname);
    } catch {
      return false;
    }
  };

  const saveUrl = async () => {
    const nextUrl = urlDraft.trim();
    if (!isValidUrl(nextUrl)) {
      setUrlError('Enter a secure Google review URL starting with https://.');
      setSaved(false);
      return;
    }

    await storage.setItem(STORAGE_KEY, nextUrl);
    setCurrentUrl(nextUrl);
    setUrlDraft(nextUrl);
    setUrlError(null);
    setSaved(true);
  };

  const clearDraft = () => {
    setUrlDraft('');
    setUrlError(null);
    setSaved(false);
  };

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
          <Text style={styles.headerTitle}>Google Review Link</Text>
          <Text style={styles.headerSubtitle}>
            Add the link guests will use to leave a review for your restaurant.
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
        <Text style={styles.sectionLabel}>CURRENT URL</Text>
        <View style={styles.currentCard} testID="google-review-current">
          <View style={styles.currentIcon}>
            <Feather name="star" size={17} color="#FFFFFF" />
          </View>
          <View style={styles.currentCopy}>
            <Text style={styles.currentValue} numberOfLines={2}>
              {currentUrl || 'No review link added yet'}
            </Text>
            <Text style={styles.currentHint}>
              {currentUrl ? 'This link is ready to share with guests.' : 'Add a URL below to activate this setting.'}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{currentUrl ? 'ACTIVE' : 'EMPTY'}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>CHANGE URL</Text>
        <View style={[styles.inputWrap, urlError && styles.inputWrapInvalid]}>
          <Feather name="link" size={18} color={colors.mutedForeground} />
          <TextInput
            value={urlDraft}
            onChangeText={(value) => {
              setUrlDraft(value);
              setUrlError(null);
              setSaved(false);
            }}
            placeholder="https://g.page/r/your-restaurant/review"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor={colors.foreground}
            style={styles.input}
            testID="google-review-url-input"
            accessibilityLabel="Google review URL"
          />
          {urlDraft.length > 0 && (
            <Pressable
              onPress={clearDraft}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear Google review URL"
              hitSlop={8}
            >
              <Feather name="x" size={14} color={colors.foreground} />
            </Pressable>
          )}
        </View>
        {urlError ? (
          <Text style={styles.errorText} testID="google-review-url-error">{urlError}</Text>
        ) : (
          <Text style={styles.helperText}>
            Paste the Google review link from your Business Profile. It should begin with https://.
          </Text>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Feather name="info" size={18} color={colors.foreground} />
          </View>
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Where this link will be used</Text>
            <Text style={styles.infoDescription}>
              Once saved, this URL will power the Google Review button shown to your guests.
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
          style={({ pressed }) => [
            styles.saveButton,
            (!isValidUrl(urlDraft) || saved) && styles.saveButtonDisabled,
            pressed && styles.pressed,
          ]}
          onPress={saveUrl}
          accessibilityRole="button"
          accessibilityLabel="Save Google review link"
          disabled={!isValidUrl(urlDraft) || saved}
          testID="google-review-url-save"
        >
          <Feather name={saved ? 'check' : 'save'} size={17} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>{saved ? 'Link Saved' : 'Save Review Link'}</Text>
        </Pressable>
      </View>
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
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 11,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
  },
  currentCopy: {
    flex: 1,
    minWidth: 0,
  },
  currentValue: {
    color: colors.foreground,
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '700',
  },
  currentHint: {
    color: colors.mutedForeground,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusPillText: {
    color: colors.foreground,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  inputWrap: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputWrapInvalid: {
    borderColor: colors.foreground,
  },
  input: {
    flex: 1,
    color: colors.foreground,
    fontSize: 13.5,
    paddingHorizontal: 11,
    paddingVertical: 14,
  },
  clearButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  errorText: {
    color: colors.foreground,
    fontSize: 11,
    lineHeight: 16,
    marginTop: -4,
  },
  helperText: {
    color: colors.mutedForeground,
    fontSize: 11,
    lineHeight: 16,
    marginTop: -4,
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
  saveButtonDisabled: {
    opacity: 0.45,
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