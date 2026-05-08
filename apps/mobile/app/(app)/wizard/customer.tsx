import { useRouter } from 'expo-router';
import { CreateReportStep1Screen } from '@/screens/wizard/CreateReportStep1Screen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';
import { useAuth } from '@/context/AuthContext';

export default function WizardCustomerPage() {
  const router = useRouter();
  const { businessProfile } = useAuth();
  return (
    <CreateReportStep1Screen
      onNext={() => router.push(ROUTES.WIZARD_ISSUE)}
      onBack={() => safeBack(router, ROUTES.APP_CREATE)}
      professionalId={businessProfile?.id}
    />
  );
}
