import { useRouter } from 'expo-router';
import { PdfPreviewScreen } from '@/screens/output/PdfPreviewScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';

export default function WizardPreviewPage() {
  const router = useRouter();
  return (
    <PdfPreviewScreen
      onBack={() => safeBack(router, ROUTES.WIZARD_RECOMMENDATIONS)}
      onSend={() => router.push('/(app)/wizard/send')}
    />
  );
}
