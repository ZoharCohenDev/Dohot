import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/navigation/constants';
import { lightColors } from '@/theme/tokens';

export default function AuthLayout() {
  const { session, loading, hasBusinessProfile } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: lightColors.bg }}>
        <ActivityIndicator size="large" color={lightColors.accent} />
      </View>
    );
  }

  if (session) {
    return <Redirect href={hasBusinessProfile ? ROUTES.APP_HOME : ROUTES.ONBOARDING_BUSINESS} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_left' }} />
  );
}
