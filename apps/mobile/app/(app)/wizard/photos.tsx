import { useRouter } from 'expo-router';
import { CreateReportStep3Screen } from '@/screens/wizard/CreateReportStep3Screen';
import { ROUTES } from '@/navigation/constants';

export default function WizardPhotosPage() {
  const router = useRouter();
  return (
    <CreateReportStep3Screen
      onNext={() => router.push(ROUTES.WIZARD_VOICE_IDLE)}
      onBack={() => router.back()}
      onAnnotate={() => router.push(ROUTES.WIZARD_ANNOTATE)}
    />
  );
}
