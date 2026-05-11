import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nManager } from 'react-native';
import * as Font from 'expo-font';
import * as Updates from 'expo-updates';
import { Heebo_300Light, Heebo_400Regular, Heebo_500Medium, Heebo_600SemiBold, Heebo_700Bold, Heebo_800ExtraBold } from '@expo-google-fonts/heebo';
import { FrankRuhlLibre_400Regular, FrankRuhlLibre_500Medium, FrankRuhlLibre_700Bold } from '@expo-google-fonts/frank-ruhl-libre';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';

// IMPORTANT: Read isRTL BEFORE calling forceRTL.
// forceRTL(true) synchronously mutates I18nManager.isRTL in the current JS context,
// which would make the reload-check below always see true — and never reload.
// We need the pre-mutation native value to know if the native layout was set to LTR.
const nativeIsRTL = I18nManager.isRTL;

// Write to SharedPreferences so the next native init (or reload) picks up RTL.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

console.log(`[RTL] nativeIsRTL=${nativeIsRTL} __DEV__=${__DEV__}`);

export default function RootLayout() {
  // In production: if the native layout started as LTR (plugin didn't run or first cold
  // launch), forceRTL already wrote to SharedPreferences. A JS bundle reload forces the
  // new React Native runtime to re-read SharedPreferences → isRTL=true.
  // Loop-safe: after reload nativeIsRTL is true (captured before forceRTL), so this
  // condition never fires again in subsequent runs.
  const needsRtlReload = !nativeIsRTL && !__DEV__;

  React.useEffect(() => {
    if (needsRtlReload) {
      console.log('[RTL] Triggering reload to apply RTL from SharedPreferences');
      Updates.reloadAsync().catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Block render until RTL reload completes or fonts are ready
  if (needsRtlReload || (!fontsLoaded && !fontError)) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SettingsProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
<Stack.Screen name="(app)" options={{ animation: 'fade' }} />
            </Stack>
          </AuthProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
