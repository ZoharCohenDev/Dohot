import { useRouter } from 'expo-router';
import { CreateReportStep3Screen } from '@/screens/wizard/CreateReportStep3Screen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';

export default function WizardPhotosPage() {
  const router = useRouter();
  return (
    <CreateReportStep3Screen
      onNext={() => router.push(ROUTES.WIZARD_VOICE_IDLE)}
      onBack={() => safeBack(router, ROUTES.WIZARD_ISSUE)}
      onAnnotate={() => router.push(ROUTES.WIZARD_ANNOTATE)}
    />
  );
}
