import { useRouter } from 'expo-router';
import { ProfileScreen } from '@/screens/onboarding/ProfileScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';

export default function ProfilePage() {
  const router = useRouter();
  return (
    <ProfileScreen
      onNext={() => router.push(ROUTES.AUTH_TRUST)}
      onBack={() => safeBack(router, ROUTES.AUTH_WELCOME)}
    />
  );
}
