import { useRouter } from 'expo-router';
import { TranscriptReviewScreen } from '@/screens/wizard/TranscriptReviewScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';

export default function WizardTranscriptPage() {
  const router = useRouter();

  return (
    <TranscriptReviewScreen
      onNext={() => router.push(ROUTES.WIZARD_PROCESSING)}
      onBack={() => safeBack(router, ROUTES.WIZARD_VOICE_IDLE)}
    />
  );
}
