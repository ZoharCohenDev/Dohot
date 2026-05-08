import { useRouter, useLocalSearchParams } from 'expo-router';
import { BusinessSetupScreen } from '@/screens/onboarding/BusinessSetupScreen';
import type { Profession } from '@dohot/shared';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';

export default function BusinessSetupPage() {
  const router = useRouter();
  const { name, profession } = useLocalSearchParams<{ name?: string; profession?: string }>();
  return (
    <BusinessSetupScreen
      initialName={name ?? ''}
      initialProfession={(profession as Profession) ?? 'other'}
      onDone={() => router.replace(ROUTES.APP_HOME)}
      onBack={() => safeBack(router, ROUTES.AUTH_REGISTER)}
    />
  );
}
