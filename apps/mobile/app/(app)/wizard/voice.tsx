import { useRouter } from 'expo-router';
import { CreateReportStep4Screen } from '@/screens/wizard/CreateReportStep4Screen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';
import { useWizard } from '@/context/WizardContext';

// Transcript captured from the voice session UI
const MOCK_TRANSCRIPT =
  'נמצאה נזילה פעילה בקיר המערבי של חדר השינה, ליד החלון, כתם רטיבות בקוטר כ-40 ס״מ. ' +
  'בבדיקה תרמית זוהה הפרש טמפרטורה של 4.2 מעלות, מה שמעיד על מקור רטיבות מהצנרת הראשית.';

export default function WizardVoicePage() {
  const router = useRouter();
  const wizard = useWizard();

  return (
    <CreateReportStep4Screen
      onNext={() => {
        wizard.setVoiceTranscript(MOCK_TRANSCRIPT);
        router.push(ROUTES.WIZARD_PROCESSING);
      }}
      onBack={() => safeBack(router, ROUTES.WIZARD_VOICE_IDLE)}
    />
  );
}
