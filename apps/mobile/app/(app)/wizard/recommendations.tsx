import { useRouter } from 'expo-router';
import { CreateReportSummaryScreen } from '@/screens/wizard/CreateReportSummaryScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';
import { useWizard } from '@/context/WizardContext';
import type { Recommendation } from '@dohot/shared';
import { useColors } from '@/theme';

export default function WizardRecommendationsPage() {
  const router = useRouter();
  const wizard = useWizard();
  const colors = useColors();

  const handleNext = (updates: { index: number; aiSummary: string; recs: Recommendation[] }[]) => {
    wizard.setAllIssueRecommendations(updates);
    router.push(ROUTES.WIZARD_PREVIEW);
  };

  return (
    <CreateReportSummaryScreen
      colors={colors}
      onNext={handleNext}
      onBack={() => safeBack(router, ROUTES.WIZARD_PROCESSING)}
      isSaving={wizard.saving}
    />
  );
}
