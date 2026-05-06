import { useRouter } from 'expo-router';
import { IssueStep } from '@/screens/wizard/IssueStep';

export default function WizardIssuePage() {
  const router = useRouter();
  return (
    <IssueStep
      onNext={() => router.push('/(app)/wizard/photos')}
      onBack={() => router.back()}
    />
  );
}
