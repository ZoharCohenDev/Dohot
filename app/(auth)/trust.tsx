import { useRouter } from 'expo-router';
import { TrustScreen } from '@/screens/onboarding/TrustScreen';

export default function TrustPage() {
  const router = useRouter();
  return (
    <TrustScreen
      onNext={() => router.replace('/(app)')}
      onBack={() => router.back()}
    />
  );
}
