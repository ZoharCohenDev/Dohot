import { useRouter } from 'expo-router';
import { CreateReportStep4Screen } from '@/screens/wizard/CreateReportStep4Screen';
import { ROUTES } from '@/navigation/constants';

export default function WizardVoicePage() {
  const router = useRouter();
  return (
    <CreateReportStep4Screen
      onNext={() => router.push(ROUTES.WIZARD_PROCESSING)}
      onBack={() => router.back()}
    />
  );
}
