import { useRouter } from 'expo-router';
import { PhotoAnnotateScreen } from '@/screens/wizard/PhotoAnnotateScreen';

export default function WizardAnnotatePage() {
  const router = useRouter();
  return (
    <PhotoAnnotateScreen
      onBack={() => router.back()}
      onDone={() => router.back()}
    />
  );
}
