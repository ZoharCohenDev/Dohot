import { useRouter } from 'expo-router';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { ROUTES } from '@/navigation/constants';

export default function WelcomePage() {
  const router = useRouter();
  return (
    <WelcomeScreen
      onNext={() => router.push(ROUTES.AUTH_PROFILE)}
      onLogin={() => router.push(ROUTES.AUTH_LOGIN)}
    />
  );
}
