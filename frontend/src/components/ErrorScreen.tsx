import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';

export default function ErrorScreen({
  message,
  onRetry,
  onLogout,
}: {
  message?: string | null;
  onRetry?: () => void;
  onLogout?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="error-screen">
      <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
        <Feather name="wifi-off" size={28} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>Something went wrong</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{message || 'Please check your connection and try again.'}</Text>
      {onRetry && (
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={onRetry} testID="error-retry-button">
          <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Retry</Text>
        </TouchableOpacity>
      )}
      {onLogout && (
        <TouchableOpacity style={styles.linkBtn} onPress={onLogout} testID="error-logout-button">
          <Text style={[styles.linkBtnText, { color: colors.mutedForeground }]}>Sign out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  primaryBtn: {
    marginTop: 16, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10,
  },
  primaryBtnText: { fontWeight: '600', fontSize: 15 },
  linkBtn: { marginTop: 4, paddingVertical: 8 },
  linkBtnText: { fontSize: 14 },
});
