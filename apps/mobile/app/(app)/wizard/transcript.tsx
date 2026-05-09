import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { TranscriptReviewScreen } from '@/screens/wizard/TranscriptReviewScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';
import { useWizard } from '@/context/WizardContext';
import { transcribeAudioFile } from '@/services/ai';

export default function WizardTranscriptPage() {
  const router = useRouter();
  const wizard = useWizard();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionFailed, setTranscriptionFailed] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    // Guard: run once per mount, skip if we already have a transcript
    if (startedRef.current) return;
    startedRef.current = true;

    const uri = wizard.state.recordedAudioUri;
    console.log('[TranscriptPage] recordedAudioUri:', uri || '(empty)');

    if (!uri || wizard.currentIssue.description) {
      console.log('[TranscriptPage] Skipping transcription —', !uri ? 'no URI' : 'transcript already exists');
      return;
    }

    setIsTranscribing(true);
    console.log('[TranscriptPage] Starting transcription...');

    transcribeAudioFile(uri)
      .then((text) => {
        console.log('[TranscriptPage] Transcription success, length:', text.length);
        wizard.setVoiceTranscript(text);
        setTranscriptionFailed(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[TranscriptPage] Transcription failed:', msg);
        setTranscriptionFailed(true);
      })
      .finally(() => {
        setIsTranscribing(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddIssue = () => {
    wizard.addNewIssue();
    router.push(ROUTES.WIZARD_ISSUE);
  };

  return (
    <TranscriptReviewScreen
      isTranscribing={isTranscribing}
      transcriptionFailed={transcriptionFailed}
      onNext={() => router.push(ROUTES.WIZARD_PROCESSING)}
      onAddIssue={handleAddIssue}
      onBack={() => safeBack(router, ROUTES.WIZARD_VOICE_IDLE)}
    />
  );
}
