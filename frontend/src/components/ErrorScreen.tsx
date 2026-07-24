import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../constants/colors';

export default function ErrorScreen({
  message,
  onRetry,
  onLogout,
}: {
  message?: string | null;
  onRetry?: () => void;
  onLogout?: () => void;
}) {
  return (
    <View style={styles.container} testID="error-screen">
      <View style={styles.iconCircle}>
        <Feather name="wifi-off" size={28} color={colors.mutedForeground} />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.subtitle}>{message || 'Please check your connection and try again.'}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.primaryBtn} onPress={onRetry} testID="error-retry-button">
          <Text style={styles.primaryBtnText}>Retry</Text>
        </TouchableOpacity>
      )}
      {onLogout && (
        <TouchableOpacity style={styles.linkBtn} onPress={onLogout} testID="error-logout-button">
          <Text style={styles.linkBtnText}>Sign out</Text>
        </TouchableOpacity>
      )}
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
    gap: 12,
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.muted,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.foreground, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  primaryBtn: {
    marginTop: 16, backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  linkBtn: { marginTop: 4, paddingVertical: 8 },
  linkBtnText: { color: colors.mutedForeground, fontSize: 14 },
});
