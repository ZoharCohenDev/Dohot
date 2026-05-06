import { useRouter } from 'expo-router';
import { LoginScreen } from '@/screens/auth/LoginScreen';

export default function LoginPage() {
  const router = useRouter();
  return (
    <LoginScreen
      onCodeSent={(phone) =>
        router.push({ pathname: '/(auth)/verify', params: { phone } })
      }
      onRegister={() => router.push('/(auth)/register')}
    />
  );
}
