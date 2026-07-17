import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { authClient } from '@/auth/client';
import { useApp } from '@/providers/AppProvider';
import { useColors } from '@/hooks/useColors';

export default function SignIn() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setAuthInProgress } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setAuthInProgress(true);
    await Haptics.selectionAsync();

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
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 32,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
          <Feather name="grid" size={28} color="#fff" />
        </View>
        <Text style={[styles.appName, { color: colors.foreground }]}>
          Exzibo Manager
        </Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          Restaurant management, simplified.
        </Text>
      </View>

      {/* Sign-in card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>
          Welcome back
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: colors.mutedForeground }]}>
          Sign in to manage your restaurant
        </Text>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Feather name="alert-circle" size={14} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.googleButton,
            { borderColor: colors.border },
            loading && styles.googleButtonDisabled,
          ]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <Feather name="chrome" size={20} color={colors.foreground} />
          )}
          <Text style={[styles.googleButtonText, { color: colors.foreground }]}>
            {loading ? 'Opening browser…' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.footer, { color: colors.mutedForeground }]}>
        Access is granted by your restaurant administrator.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 32,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  welcomeSubtitle: {
    fontSize: 14,
    marginTop: -8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    flex: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
