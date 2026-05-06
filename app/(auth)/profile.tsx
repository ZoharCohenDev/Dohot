import { useRouter } from 'expo-router';
import { ProfileScreen } from '@/screens/onboarding/ProfileScreen';

export default function ProfilePage() {
  const router = useRouter();
  return (
    <ProfileScreen
      onNext={() => router.push('/(auth)/trust')}
      onBack={() => router.back()}
    />
  );
}
