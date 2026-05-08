import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/navigation/constants';
import { lightColors } from '@/theme/tokens';

export default function OnboardingLayout() {
  const { session, loading, hasBusinessProfile } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: lightColors.bg }}>
        <ActivityIndicator size="large" color={lightColors.accent} />
      </View>
    );
  }

  if (!session) return <Redirect href={ROUTES.AUTH_LOGIN} />;
  if (hasBusinessProfile) return <Redirect href={ROUTES.APP_HOME} />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_left',
      }}
    />
  );
}
