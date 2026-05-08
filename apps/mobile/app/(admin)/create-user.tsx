import { useRouter } from 'expo-router';
import { CreateUserScreen } from '@/screens/admin/CreateUserScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';

export default function CreateUserPage() {
  const router = useRouter();
  return (
    <CreateUserScreen
      onDone={() => router.replace(ROUTES.ADMIN_HOME)}
      onBack={() => safeBack(router, ROUTES.ADMIN_HOME)}
    />
  );
}
