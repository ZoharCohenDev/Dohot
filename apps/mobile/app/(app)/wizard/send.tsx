import { useRouter } from 'expo-router';
import { SendScreen } from '@/screens/output/SendScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';
import { useColors } from '@/theme';
import { useWizard } from '@/context/WizardContext';

export default function WizardSendPage() {
  const router = useRouter();
  const colors = useColors();
  const wizard = useWizard();
  return (
    <SendScreen
      colors={colors}
      onBack={() => safeBack(router, ROUTES.WIZARD_PREVIEW)}
      onDone={() => {
        wizard.reset();
        router.replace(ROUTES.APP_HOME);
      }}
    />
  );
}
