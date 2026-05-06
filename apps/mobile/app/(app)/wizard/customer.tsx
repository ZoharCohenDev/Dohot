import { useRouter } from 'expo-router';
import { CreateReportStep1Screen } from '@/screens/wizard/CreateReportStep1Screen';
import { ROUTES } from '@/navigation/constants';

export default function WizardCustomerPage() {
  const router = useRouter();
  return (
    <CreateReportStep1Screen
      onNext={() => router.push(ROUTES.WIZARD_ISSUE)}
      onBack={() => router.back()}
    />
  );
}
