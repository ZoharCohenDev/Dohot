import { useRouter } from 'expo-router';
import { PdfPreviewScreen } from '@/screens/output/PdfPreviewScreen';

export default function WizardPreviewPage() {
  const router = useRouter();
  return (
    <PdfPreviewScreen
      onBack={() => router.back()}
      onSend={() => router.push('/(app)/wizard/send')}
    />
  );
}
