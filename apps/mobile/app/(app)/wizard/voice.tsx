import { useState } from 'react';
import { useRouter } from 'expo-router';
import { CreateReportStep4Screen } from '@/screens/wizard/CreateReportStep4Screen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';
import { useWizard } from '@/context/WizardContext';
import { transcribeAudio } from '@/services/ai';

export default function WizardVoicePage() {
  const router = useRouter();
  const wizard = useWizard();
  const [transcribing, setTranscribing] = useState(false);

  const handleStop = async (audioUri: string) => {
    setTranscribing(true);
    try {
      const transcript = await transcribeAudio(audioUri);
      wizard.setVoiceTranscript(transcript);
    } catch {
      wizard.setVoiceTranscript('');
    } finally {
      setTranscribing(false);
      router.push(ROUTES.WIZARD_TRANSCRIPT);
    }
  };

  return (
    <CreateReportStep4Screen
      onStop={handleStop}
      onBack={() => safeBack(router, ROUTES.WIZARD_VOICE_IDLE)}
      transcribing={transcribing}
    />
  );
}
