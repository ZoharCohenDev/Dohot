import { useRouter } from 'expo-router';
import { VoiceScreen } from '@/screens/wizard/VoiceScreen';

export default function WizardVoicePage() {
  const router = useRouter();
  return (
    <VoiceScreen
      onNext={() => router.push('/(app)/wizard/processing')}
      onBack={() => router.back()}
    />
  );
}
