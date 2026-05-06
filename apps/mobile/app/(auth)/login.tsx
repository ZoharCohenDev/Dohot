import { useRouter } from 'expo-router';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { ROUTES } from '@/navigation/constants';

export default function LoginPage() {
  const router = useRouter();
  return (
    <LoginScreen
      onLoggedIn={() => router.replace(ROUTES.APP_HOME)}
      onRegister={() => router.push(ROUTES.AUTH_REGISTER)}
    />
  );
}
