import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useApp } from '@/src/providers/AppProvider';
import LoadingScreen from '@/src/components/LoadingScreen';
import ErrorScreen from '@/src/components/ErrorScreen';
import colors from '@/src/constants/colors';

export default function Index() {
  const { state, errorMessage, retryBootstrap, logout } = useApp();

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
      return <ErrorScreen message={errorMessage} onRetry={retryBootstrap} onLogout={logout} />;
    case 'no-restaurants':
      return <NoAccess onLogout={logout} />;
    case 'select-restaurant':
      return <Redirect href="/(app)/select-restaurant" />;
    case 'home':
      return <Redirect href="/(app)/orders" />;
    default:
      return <LoadingScreen />;
  }
}

function NoAccess({ onLogout }: { onLogout: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
      testID="no-access-screen"
    >
      <View style={styles.iconCircle}>
        <Feather name="lock" size={32} color={colors.mutedForeground} />
      </View>
      <Text style={styles.title}>No Restaurant Access</Text>
      <Text style={styles.subtitle}>
        Your account is not associated with any restaurants. Contact your administrator.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onLogout}
        activeOpacity={0.8}
        testID="no-access-sign-out"
      >
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.muted,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.foreground, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.mutedForeground, textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  button: {
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10, alignItems: 'center',
    width: '100%', marginTop: 8, backgroundColor: colors.primary,
  },
  buttonText: { color: colors.primaryForeground, fontSize: 16, fontWeight: '600' },
});
