import { useRouter, useLocalSearchParams } from 'expo-router';
import { BusinessSetupScreen } from '@/screens/onboarding/BusinessSetupScreen';
import type { Profession } from '@dohot/shared';

export default function BusinessSetupPage() {
  const router = useRouter();
  const { name, profession } = useLocalSearchParams<{ name?: string; profession?: string }>();
  return (
    <BusinessSetupScreen
      initialName={name ?? ''}
      initialProfession={(profession as Profession) ?? 'other'}
      onDone={() => router.replace('/(app)')}
      onBack={() => router.back()}
    />
  );
}
