import { useRouter, useLocalSearchParams } from 'expo-router';
import { PhotoAnnotateScreen } from '@/screens/wizard/PhotoAnnotateScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';
import { useWizard } from '@/context/WizardContext';
import { useAuth } from '@/context/AuthContext';

export default function WizardAnnotatePage() {
  const router = useRouter();
  const { photoUri } = useLocalSearchParams<{ photoUri?: string }>();
  const { replacePhoto } = useWizard();
  const { user } = useAuth();

  const originalUri = photoUri ? decodeURIComponent(photoUri) : undefined;

  const handleDone = (annotatedUri: string) => {
    if (originalUri && annotatedUri && annotatedUri !== originalUri) {
      replacePhoto(originalUri, annotatedUri);
    }
    safeBack(router, ROUTES.WIZARD_PHOTOS);
  };

  return (
    <PhotoAnnotateScreen
      photoUri={originalUri}
      userId={user?.id}
      onBack={() => safeBack(router, ROUTES.WIZARD_PHOTOS)}
      onDone={handleDone}
    />
  );
}
