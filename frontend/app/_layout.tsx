import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Component, useEffect, type ReactNode } from "react";
import { LogBox, View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AppProvider } from "@/src/providers/AppProvider";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true);

// Keep the native splash visible from cold start until icon fonts register.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Catch any uncaught JS error and render it on screen so the user can read it
// in Expo Go instead of the generic "Something went wrong" message.
class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[RootErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorContainer}>
          <ScrollView contentContainerStyle={styles.errorContent}>
            <Text style={styles.errorTitle}>JS Error</Text>
            <Text style={styles.errorName}>{this.state.error.name}</Text>
            <Text style={styles.errorMessage}>{this.state.error.message}</Text>
            {this.state.error.stack && (
              <Text style={styles.errorStack}>{this.state.error.stack}</Text>
            )}
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <RootErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AppProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </AppProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 48,
  },
  errorContent: {
    padding: 16,
  },
  errorTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorName: {
    color: "#ff5555",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  errorMessage: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 16,
  },
  errorStack: {
    color: "#aaa",
    fontSize: 12,
    fontFamily: "monospace",
  },
});
