import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { VoiceProcessingScreen } from '@/screens/wizard/VoiceProcessingScreen';
import { ROUTES } from '@/navigation/constants';
import { useWizard } from '@/context/WizardContext';
import { cleanReportText } from '@/services/ai';

const MIN_DISPLAY_MS = 3000;

export default function WizardProcessingPage() {
  const router = useRouter();
  const wizard = useWizard();
  const navigated = useRef(false);

  useEffect(() => {
    const run = async () => {
      const start = Date.now();
      const issues = wizard.state.reportIssues;

      // Process each issue sequentially to avoid rate limiting
      const results: { index: number; aiSummary: string; recommendations: { priority: string; title: string; description: string }[] }[] = [];

      for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        if (!issue) continue;
        const rawText = issue.description.trim() || issue.issueNote.trim();
        if (!rawText) continue;

        try {
          const result = await cleanReportText(rawText, issue.issueType);
          results.push({
            index: i,
            aiSummary: result.professionalText,
            recommendations: result.recommendations,
          });
        } catch {
          // Graceful fallback — keep whatever description was already set
        }
      }

      if (results.length > 0) {
        wizard.setAllAiResults(results);
      }

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
