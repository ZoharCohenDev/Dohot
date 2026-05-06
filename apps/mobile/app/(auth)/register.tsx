import { useRouter } from 'expo-router';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';

export default function RegisterPage() {
  const router = useRouter();
  return (
    <RegisterScreen
      onCodeSent={(phone, name, profession) =>
        router.push({ pathname: '/(auth)/verify', params: { phone, name, profession } })
      }
      onBack={() => router.back()}
      onLogin={() => router.push('/(auth)/login')}
    />
  );
}
