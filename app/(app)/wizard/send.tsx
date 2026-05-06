import { useRouter } from 'expo-router';
import { SendScreen } from '@/screens/output/SendScreen';

export default function WizardSendPage() {
  const router = useRouter();
  return (
    <SendScreen
      onBack={() => router.back()}
    />
  );
}
