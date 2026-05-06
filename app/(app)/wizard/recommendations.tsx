import { useRouter } from 'expo-router';
import { RecommendationsStep } from '@/screens/wizard/RecommendationsStep';

export default function WizardRecommendationsPage() {
  const router = useRouter();
  return (
    <RecommendationsStep
      onNext={() => router.push('/(app)/wizard/preview')}
      onBack={() => router.back()}
    />
  );
}
