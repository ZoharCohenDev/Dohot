import { useRouter } from 'expo-router';
import { PdfPreviewScreen } from '@/screens/output/PdfPreviewScreen';
import { ROUTES } from '@/navigation/constants';
import { useWizardStep } from '@/hooks/useWizardStep';
import { useColors } from '@/theme';

export default function WizardPreviewPage() {
  const router = useRouter();
  const { goBack } = useWizardStep();
  const colors = useColors();
  return (
    <PdfPreviewScreen
      colors={colors}
      onBack={goBack}
      onSend={() => router.push(ROUTES.WIZARD_SEND as never)}
    />
  );
}
