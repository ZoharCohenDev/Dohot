import { useRouter } from 'expo-router';
import { SendScreen } from '@/screens/output/SendScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';

export default function WizardSendPage() {
  const router = useRouter();
  return (
    <SendScreen
      onBack={() => safeBack(router, ROUTES.WIZARD_PREVIEW)}
      onDone={() => router.replace(ROUTES.APP_HOME)}
    />
  );
}
