import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  useFonts,
} from "@expo-google-fonts/cairo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { I18nManager, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RemindersProvider } from "@/context/RemindersContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { requestNotificationPermission } from "@/lib/notifications";

SplashScreen.preventAutoHideAsync();

// Force right-to-left layout for the entire app.
if (!I18nManager.isRTL) {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  } catch {
    // ignore — will take effect on next reload for native
  }
}
if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.dir = "rtl";
  document.documentElement.lang = "ar";
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="new"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="reminder/[id]"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen name="stats" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="feedback" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <ThemeProvider>
                <RemindersProvider>
                  <RootLayoutNav />
                </RemindersProvider>
              </ThemeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
