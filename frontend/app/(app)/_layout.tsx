import { Redirect, Stack } from 'expo-router';
import colors from '@/src/constants/colors';
import { useApp } from '@/src/providers/AppProvider';

export default function AppLayout() {
  const { state } = useApp();

  if (state === 'signed-out' || state === 'session-loading') {
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
    </Stack>
  );
}
