import { useRouter, useLocalSearchParams } from 'expo-router';
import { PhotoAnnotateScreen } from '@/screens/wizard/PhotoAnnotateScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';

export default function WizardAnnotatePage() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams<{ photoUri?: string }>();
  return (
    <PhotoAnnotateScreen
      photoUri={photoUri ? decodeURIComponent(photoUri) : undefined}
      onBack={() => safeBack(router, ROUTES.WIZARD_PHOTOS)}
      onDone={() => safeBack(router, ROUTES.WIZARD_PHOTOS)}
    />
  );
}
