import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { authClient } from '@/src/auth/client';
import { useApp } from '@/src/providers/AppProvider';
import { useTheme } from '@/src/providers/ThemeProvider';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { state, setAuthInProgress } = useApp();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authed = state !== 'signed-out' && state !== 'auth-in-progress' && state !== 'session-loading';
  if (authed) return <Redirect href="/" />;

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    setAuthInProgress(true);
    await Haptics.selectionAsync().catch(() => {});

    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/auth/callback',
      });
      // Browser has opened; session will resolve asynchronously via deep link
    } catch {
      setError('Sign in failed. Please try again.');
      setAuthInProgress(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: colors.foreground }]}>
            <Feather name="grid" size={28} color={colors.background} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>Exzibo Manager</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Restaurant management, simplified.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>Welcome back</Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>
            Sign in to manage your restaurant
          </Text>

          {error && (
            <View style={styles.errorBox} testID="signin-error">
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            testID="signin-google-button"
            style={[styles.googleBtn, { backgroundColor: colors.foreground }, loading && { opacity: 0.7 }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Feather name="chrome" size={20} color={colors.background} />
            )}
            <Text style={[styles.googleBtnText, { color: colors.background }]}>
              {loading ? 'Opening browser…' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>Access is granted by your restaurant administrator.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, gap: 22, justifyContent: 'center' },
  header: { alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  appName: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { fontSize: 14, textAlign: 'center' },
  card: {
    borderRadius: 16, borderWidth: 1,
    padding: 22, gap: 14,
  },
  welcomeTitle: { fontSize: 20, fontWeight: '700' },
  welcomeSubtitle: { fontSize: 13, marginTop: -8 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    borderRadius: 8, borderWidth: 1, borderColor: '#7F1D1D', backgroundColor: '#3B1D1D',
  },
  errorText: { fontSize: 13, color: '#F87171', flex: 1 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    borderRadius: 12, paddingVertical: 14,
  },
  googleBtnText: { fontSize: 15, fontWeight: '700' },
  footer: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
