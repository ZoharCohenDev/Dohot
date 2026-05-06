import { useRouter } from 'expo-router';
import { PhotosStep } from '@/screens/wizard/PhotosStep';

export default function WizardPhotosPage() {
  const router = useRouter();
  return (
    <PhotosStep
      onNext={() => router.push('/(app)/wizard/voice-idle')}
      onBack={() => router.back()}
      onAnnotate={() => router.push('/(app)/wizard/annotate')}
    />
  );
}
