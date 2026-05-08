import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { VoiceProcessingScreen } from '@/screens/wizard/VoiceProcessingScreen';
import { ROUTES } from '@/navigation/constants';
import { useWizard } from '@/context/WizardContext';
import { cleanReportText } from '@/services/ai';

// Minimum time to show the processing animation even if the API is fast
const MIN_DISPLAY_MS = 3000;

export default function WizardProcessingPage() {
  const router = useRouter();
  const wizard = useWizard();
  const navigated = useRef(false);

  useEffect(() => {
    const run = async () => {
      const start = Date.now();

      try {
        const result = await cleanReportText(
          wizard.state.voiceTranscript,
          wizard.state.issueType,
        );
        wizard.setAiResult(result.professionalText, result.recommendations);
      } catch {
        // Graceful fallback: proceed with defaults if AI fails
      }

      // Keep the animation visible for at least MIN_DISPLAY_MS
      const elapsed = Date.now() - start;
      const remaining = MIN_DISPLAY_MS - elapsed;
      if (remaining > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, remaining));
      }

      if (!navigated.current) {
        navigated.current = true;
        router.push(ROUTES.WIZARD_RECOMMENDATIONS);
      }
    };

    run();

    return () => {
      navigated.current = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <VoiceProcessingScreen />;
}
