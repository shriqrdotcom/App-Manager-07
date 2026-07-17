import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

interface Props {
  message?: string;
  onRetry?: () => void;
  onLogout?: () => void;
}

export default function ErrorScreen({
  message = 'Unable to reach the server. Please check your connection.',
  onRetry,
  onLogout,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
        <Feather name="wifi-off" size={32} color={colors.mutedForeground} />
      </View>

      <Text style={[styles.title, { color: colors.foreground }]}>
        Connection Error
      </Text>
      <Text style={[styles.message, { color: colors.mutedForeground }]}>
        {message}
      </Text>

      {onRetry && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
            Try Again
          </Text>
        </TouchableOpacity>
      )}

      {onLogout && (
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={onLogout}
          activeOpacity={0.7}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.mutedForeground }]}>
            Sign Out
          </Text>
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
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
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
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
