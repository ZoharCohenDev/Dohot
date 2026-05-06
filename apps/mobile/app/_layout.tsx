import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nManager } from 'react-native';
import * as Font from 'expo-font';
import { Heebo_300Light, Heebo_400Regular, Heebo_500Medium, Heebo_600SemiBold, Heebo_700Bold, Heebo_800ExtraBold } from '@expo-google-fonts/heebo';
import { FrankRuhlLibre_400Regular, FrankRuhlLibre_500Medium, FrankRuhlLibre_700Bold } from '@expo-google-fonts/frank-ruhl-libre';
import { AuthProvider } from '@/context/AuthContext';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  const [fontsLoaded] = Font.useFonts({
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

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_left' }} />
            <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
