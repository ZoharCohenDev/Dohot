import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { CreateReportSummaryScreen } from '@/screens/wizard/CreateReportSummaryScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';
import { useWizard } from '@/context/WizardContext';
import { useAuth } from '@/context/AuthContext';
import type { Recommendation } from '@dohot/shared';

export default function WizardRecommendationsPage() {
  const router = useRouter();
  const wizard = useWizard();
  const { businessProfile } = useAuth();

  const handleNext = async (updates: { index: number; aiSummary: string; recs: Recommendation[] }[]) => {
    wizard.setAllIssueRecommendations(updates);

    if (!businessProfile?.id) {
      Alert.alert('שגיאה', 'לא נמצא פרופיל עסקי. אנא התחבר מחדש.');
      return;
    }

    try {
      await wizard.saveDocument(businessProfile.id);
      router.push(ROUTES.WIZARD_PREVIEW);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן היה לשמור את הדוח. אנא נסה שוב.');
    }
  };

  return (
    <CreateReportSummaryScreen
      onNext={handleNext}
      onBack={() => safeBack(router, ROUTES.WIZARD_PROCESSING)}
      isSaving={wizard.saving}
    />
  );
}
