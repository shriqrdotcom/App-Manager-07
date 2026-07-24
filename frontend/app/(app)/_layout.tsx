import { Stack, Redirect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import TopHeader from '@/src/components/TopHeader';
import BottomNavigation from '@/src/components/BottomNavigation';
import { useApp } from '@/src/providers/AppProvider';
import colors from '@/src/constants/colors';

export default function AppLayout() {
  const { state } = useApp();

  if (state === 'signed-out' || state === 'session-loading') {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.container}>
      <TopHeader />
      <View style={styles.screen}>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="select-restaurant" />
          <Stack.Screen name="orders" />
          <Stack.Screen name="booking" />
          <Stack.Screen name="edit" />
          <Stack.Screen name="analytics" />
          <Stack.Screen name="settings" />
        </Stack>
      </View>
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
});
