import { IssueStep } from '@/screens/wizard/IssueStep';
import { useColors } from '@/theme';

export default function WizardIssuePage() {
  const colors = useColors();
  return <IssueStep colors={colors} />;
}
