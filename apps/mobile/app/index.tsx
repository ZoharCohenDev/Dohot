import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/navigation/constants';
import { lightColors } from '@/theme/tokens';
import { hasSeenWelcome } from '@/screens/auth/WelcomeScreen';

export default function Index() {
  const { session, loading, isAdmin, isSubscriptionExpired, isActive } = useAuth();
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    hasSeenWelcome().then((seen) => {
      setShowWelcome(!seen);
      setWelcomeChecked(true);
    });
  }, []);

  if (loading || !welcomeChecked) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: lightColors.bg }}>
        <ActivityIndicator size="large" color={lightColors.accent} />
      </View>
    );
  }

  if (!session) {
    if (showWelcome) return <Redirect href={ROUTES.AUTH_WELCOME} />;
    return <Redirect href={ROUTES.AUTH_LOGIN} />;
  }

  if (!isActive) return <Redirect href={ROUTES.AUTH_EXPIRED} />;

  if (!isAdmin && isSubscriptionExpired) return <Redirect href={ROUTES.AUTH_EXPIRED} />;

  if (isAdmin) return <Redirect href={ROUTES.ADMIN_HOME} />;

  return <Redirect href={ROUTES.APP_HOME} />;
}
