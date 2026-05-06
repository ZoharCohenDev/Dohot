import { useRouter } from 'expo-router';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { ROUTES } from '@/navigation/constants';

export default function RegisterPage() {
  const router = useRouter();
  return (
    <RegisterScreen
      onRegistered={(name, profession) =>
        router.replace({
          pathname: ROUTES.ONBOARDING_BUSINESS,
          params: { name, profession },
        })
      }
      onBack={() => router.back()}
      onLogin={() => router.push(ROUTES.AUTH_LOGIN)}
    />
  );
}
