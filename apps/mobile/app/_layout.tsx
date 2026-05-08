import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nManager } from 'react-native';
import * as Font from 'expo-font';
import { Heebo_300Light, Heebo_400Regular, Heebo_500Medium, Heebo_600SemiBold, Heebo_700Bold, Heebo_800ExtraBold } from '@expo-google-fonts/heebo';
import { FrankRuhlLibre_400Regular, FrankRuhlLibre_500Medium, FrankRuhlLibre_700Bold } from '@expo-google-fonts/frank-ruhl-libre';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';

// Force RTL at module level so it takes effect before the first render.
// On Android this requires an app restart; the check prevents repeat calls.
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = Font.useFonts({
    Heebo_300Light,
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_600SemiBold,
    Heebo_700Bold,
    Heebo_800ExtraBold,
    FrankRuhlLibre_400Regular,
    FrankRuhlLibre_500Medium,
    FrankRuhlLibre_700Bold,
    Heebo: Heebo_400Regular,
    FrankRuhlLibre: FrankRuhlLibre_400Regular,
  });

  // Keep splash screen until fonts are ready (or an error occurred)
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_left' }} />
              <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
            </Stack>
          </AuthProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
