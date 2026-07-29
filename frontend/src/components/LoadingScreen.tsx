import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

export default function LoadingScreen({ message }: { message?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="loading-screen">
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={[styles.msg, { color: colors.mutedForeground }]}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  msg: { fontSize: 14 },
});
