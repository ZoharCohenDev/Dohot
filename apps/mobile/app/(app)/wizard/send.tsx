import { useRouter } from 'expo-router';
import { SendScreen } from '@/screens/output/SendScreen';
import { ROUTES } from '@/navigation/constants';

export default function WizardSendPage() {
  const router = useRouter();
  return (
    <SendScreen
      onBack={() => router.back()}
      onDone={() => router.replace(ROUTES.APP_HOME)}
    />
  );
}
