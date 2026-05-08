import { useRouter } from 'expo-router';
import { PdfPreviewScreen } from '@/screens/output/PdfPreviewScreen';
import { ROUTES } from '@/navigation/constants';
import { useWizardStep } from '@/hooks/useWizardStep';

export default function WizardPreviewPage() {
  const router = useRouter();
  const { goBack } = useWizardStep();
  return (
    <PdfPreviewScreen
      onBack={goBack}
      onSend={() => router.push(ROUTES.WIZARD_SEND as never)}
    />
  );
}
