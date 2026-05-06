import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { VoiceProcessingScreen } from '@/screens/wizard/VoiceProcessingScreen';

export default function WizardProcessingPage() {
  const router = useRouter();

  // Auto-advance after mock processing delay
  useEffect(() => {
    const t = setTimeout(() => {
      router.push('/(app)/wizard/recommendations');
    }, 3500);
    return () => clearTimeout(t);
  }, [router]);

  return <VoiceProcessingScreen />;
}
