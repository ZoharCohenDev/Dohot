import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ErrorBoundary as ExpoErrorBoundary } from 'expo-router';
import { captureException } from '@/lib/sentry';
import { lightColors, fonts } from '@/theme/tokens';

// expo-router calls this when a route segment throws during rendering.
// Re-exporting ExpoErrorBoundary tells expo-router to use its default UI;
// we override it below with our own that also reports to Sentry.

export { ExpoErrorBoundary as ErrorBoundary };

interface Props {
  error: Error;
  retry: () => void;
}

export default function ErrorPage({ error, retry }: Props) {
  React.useEffect(() => {
    captureException(error, { source: 'expo-router-error-boundary' });
  }, [error]);

  const router = useRouter();

  return (
    <View style={styles.root}>
      <Text style={styles.title}>אירעה שגיאה</Text>
      <Text style={styles.subtitle}>
        אנחנו קיבלנו דיווח על השגיאה ונטפל בה בהקדם.
      </Text>
      <Pressable style={styles.btn} onPress={retry}>
        <Text style={styles.btnText}>נסה שנית</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => router.replace('/')}>
        <Text style={[styles.btnText, styles.btnTextSecondary]}>חזור לדף הבית</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: lightColors.bg,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: lightColors.ink1,
    fontFamily: fonts.sans,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: lightColors.ink3,
    fontFamily: fonts.sans,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: lightColors.ink1,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: lightColors.bgElev,
  },
  btnText: {
    color: lightColors.bg,
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 15,
  },
  btnTextSecondary: {
    color: lightColors.ink2,
  },
});
