import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/providers/AppProvider';
import { useColors } from '@/hooks/useColors';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorScreen from '@/components/ErrorScreen';

/**
 * Routing hub — decides where to send the user based on app state.
 * All state transitions are centralized here to prevent redirect loops.
 */
export default function Index() {
  const { state, retryBootstrap, logout } = useApp();

  switch (state) {
    case 'session-loading':
      return <LoadingScreen message="Starting up…" />;

    case 'signed-out':
      return <Redirect href="/(auth)/sign-in" />;

    case 'auth-in-progress':
      return <LoadingScreen message="Signing in…" />;

    case 'bootstrap-loading':
      return <LoadingScreen message="Loading your account…" />;

    case 'network-error':
      return (
        <ErrorScreen
          onRetry={retryBootstrap}
          onLogout={logout}
        />
      );

    case 'no-restaurants':
      return <NoAccessScreen onLogout={logout} />;

    case 'select-restaurant':
      return <Redirect href="/(app)/select-restaurant" />;

    case 'home':
      return <Redirect href="/(app)/home" />;

    default:
      return <LoadingScreen />;
  }
}

function NoAccessScreen({ onLogout }: { onLogout: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
        <Feather name="lock" size={32} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>
        No Restaurant Access
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Your account is not associated with any restaurants. Contact your
        administrator to request access.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onLogout}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
