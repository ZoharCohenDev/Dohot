import { useRouter } from 'expo-router';
import { CustomersScreen } from '@/screens/customers/CustomersScreen';

export default function CustomersPage() {
  const router = useRouter();
  return (
    <CustomersScreen
      onNavigate={(tab) => {
        switch (tab) {
          case 'home': return router.push('/(app)');
          case 'docs': return router.push('/(app)/documents');
          case 'me': return router.push('/(app)/me');
          case 'create': return router.push('/(app)/wizard/customer');
        }
      }}
    />
  );
}
