import { useRouter } from 'expo-router';
import { TrustScreen } from '@/screens/onboarding/TrustScreen';
import { ROUTES } from '@/navigation/constants';

export default function TrustPage() {
  const router = useRouter();
  return (
    <TrustScreen
      onNext={() => router.replace(ROUTES.APP_HOME)}
      onBack={() => router.back()}
    />
  );
}
