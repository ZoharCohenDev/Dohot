import { useRouter } from 'expo-router';
import { CreateReportStep4Screen } from '@/screens/wizard/CreateReportStep4Screen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';
import { useWizard } from '@/context/WizardContext';

export default function WizardVoicePage() {
  const router = useRouter();
  const wizard = useWizard();

  const handleStop = (audioUri: string) => {
    wizard.setRecordedAudioUri(audioUri);
    // Clear any previous transcript so the transcript page re-transcribes
    wizard.setVoiceTranscript('');
    router.push(ROUTES.WIZARD_TRANSCRIPT);
  };

  return (
    <CreateReportStep4Screen
      onStop={handleStop}
      onBack={() => safeBack(router, ROUTES.WIZARD_VOICE_IDLE)}
    />
  );
}
