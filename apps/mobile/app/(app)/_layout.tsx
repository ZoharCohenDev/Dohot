// Tab navigator is rendered inside each screen directly using BottomNav component.
// We use a Stack here and let each screen render its own BottomNav overlay.
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/navigation/constants';
import { lightColors } from '@/theme/tokens';

export default function AppLayout() {
  const { session, loading, isSubscriptionExpired, isActive } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: lightColors.bg }}>
        <ActivityIndicator size="large" color={lightColors.accent} />
      </View>
    );
  }

  if (!session) return <Redirect href={ROUTES.AUTH_LOGIN} />;
  if (!isActive || isSubscriptionExpired) return <Redirect href={ROUTES.AUTH_EXPIRED} />;

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
