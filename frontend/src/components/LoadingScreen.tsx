import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import colors from '../constants/colors';

export default function LoadingScreen({ message }: { message?: string }) {
  return (
    <View style={styles.container} testID="loading-screen">
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={styles.msg}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.background,
  },
  msg: { color: colors.mutedForeground, fontSize: 14 },
});
