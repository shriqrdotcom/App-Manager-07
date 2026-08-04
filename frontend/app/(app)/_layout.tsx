import { Redirect, Stack } from 'expo-router';
import { useApp } from '@/src/providers/AppProvider';
import { useTheme } from '@/src/providers/ThemeProvider';

export default function AppLayout() {
  const { state } = useApp();
  const { colors } = useTheme();

  if (state === 'signed-out' || state === 'session-loading') {
    return <Redirect href="/" />;
  }

  if (state === 'bootstrap-loading' || state === 'network-error' || state === 'no-restaurants') {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
        gestureEnabled: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {/* Full-screen restaurant picker (shown before reaching the tabs). */}
      <Stack.Screen name="select-restaurant" />
      {/*
       * The pager that hosts all five tab screens simultaneously.
       * Individual tab route files still exist for Expo Router's file
       * discovery, but the app never navigates to them directly.
       */}
      <Stack.Screen name="tabs" />
      {/* Notification settings — slides in from the right */}
      <Stack.Screen
        name="notification-settings"
        options={{ animation: 'slide_from_right', gestureEnabled: true }}
      />
      {/* Coupon codes — slides in from the right */}
      <Stack.Screen
        name="coupon-codes"
        options={{ animation: 'slide_from_right', gestureEnabled: true }}
      />
      {/* Team access — slides in from the right */}
      <Stack.Screen
        name="team-access"
        options={{ animation: 'slide_from_right', gestureEnabled: true }}
      />
      {/* Timing settings — slides in from the right */}
      <Stack.Screen
        name="timing-settings"
        options={{ animation: 'slide_from_right', gestureEnabled: true }}
      />
    </Stack>
  );
}
