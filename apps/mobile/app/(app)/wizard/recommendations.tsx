import { useRouter } from 'expo-router';
import { CreateReportSummaryScreen } from '@/screens/wizard/CreateReportSummaryScreen';
import { ROUTES } from '@/navigation/constants';

export default function WizardRecommendationsPage() {
  const router = useRouter();
  return (
    <CreateReportSummaryScreen
      onNext={() => router.push(ROUTES.WIZARD_PREVIEW)}
      onBack={() => router.back()}
    />
  );
}
