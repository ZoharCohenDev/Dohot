import { useRouter } from 'expo-router';
import { CreateReportStep2Screen } from '@/screens/wizard/CreateReportStep2Screen';
import { ROUTES } from '@/navigation/constants';

export default function WizardIssuePage() {
  const router = useRouter();
  return (
    <CreateReportStep2Screen
      onNext={() => router.push(ROUTES.WIZARD_PHOTOS)}
      onBack={() => router.back()}
    />
  );
}
