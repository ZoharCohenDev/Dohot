import { useRouter } from 'expo-router';
import { AdminUsersScreen } from '@/screens/admin/AdminUsersScreen';
import type { AdminUser } from '@/services/adminApi';
import { ROUTES } from '@/navigation/constants';

export default function AdminHomePage() {
  const router = useRouter();
  return (
    <AdminUsersScreen
      onCreateUser={() => router.push(ROUTES.ADMIN_CREATE_USER)}
      onEditUser={(user: AdminUser) =>
        router.push({ pathname: ROUTES.ADMIN_EDIT_USER, params: { userId: user.id } })
      }
    />
  );
}
