import { useRouter } from 'expo-router';
import { PhotosStep } from '@/screens/wizard/PhotosStep';
import { ROUTES } from '@/navigation/constants';

export default function WizardPhotosPage() {
  const router = useRouter();
  return (
    <PhotosStep
      onAnnotate={(uri) =>
        router.push(`${ROUTES.WIZARD_ANNOTATE}?photoUri=${encodeURIComponent(uri ?? '')}`)
      }
    />
  );
}
