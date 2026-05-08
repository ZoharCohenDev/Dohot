import { useRouter } from 'expo-router';
import { PhotoAnnotateScreen } from '@/screens/wizard/PhotoAnnotateScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';

export default function WizardAnnotatePage() {
  const router = useRouter();
  return (
    <PhotoAnnotateScreen
      onBack={() => safeBack(router, ROUTES.WIZARD_PHOTOS)}
      onDone={() => safeBack(router, ROUTES.WIZARD_PHOTOS)}
    />
  );
}
