import { useRouter } from 'expo-router';
import { PhotosStep } from '@/screens/wizard/PhotosStep';
import { ROUTES } from '@/navigation/constants';
import { useColors } from '@/theme';

export default function WizardPhotosPage() {
  const router = useRouter();
  const colors = useColors();
  return (
    <PhotosStep
      colors={colors}
      onAnnotate={(uri) =>
        router.push(`${ROUTES.WIZARD_ANNOTATE}?photoUri=${encodeURIComponent(uri ?? '')}`)
      }
    />
  );
}
