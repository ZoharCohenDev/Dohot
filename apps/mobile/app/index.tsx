import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/navigation/constants';
import { lightColors } from '@/theme/tokens';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: lightColors.bg }}>
        <ActivityIndicator size="large" color={lightColors.accent} />
      </View>
    );
  }

  if (session) {
    return <Redirect href={ROUTES.APP_HOME} />;
  }
  return <Redirect href={ROUTES.AUTH_LOGIN} />;
}
