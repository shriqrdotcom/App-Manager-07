import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="select-restaurant" />
      <Stack.Screen name="home" />
      <Stack.Screen name="menu" />
    </Stack>
  );
}
