import { useRouter } from 'expo-router';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';

export default function WelcomePage() {
  const router = useRouter();
  return (
    <WelcomeScreen
      onNext={() => router.push('/(auth)/profile')}
      onLogin={() => router.push('/(auth)/profile')}
    />
  );
}
