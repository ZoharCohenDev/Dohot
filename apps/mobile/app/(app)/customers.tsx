import { useRouter } from 'expo-router';
import { CustomersScreen } from '@/screens/customers/CustomersScreen';
import { ROUTES } from '@/navigation/constants';

export default function CustomersPage() {
  const router = useRouter();
  return (
    <CustomersScreen
      onNavigate={(tab) => {
        switch (tab) {
          case 'home': return router.push(ROUTES.APP_HOME);
          case 'docs': return router.push(ROUTES.APP_DOCUMENTS);
          case 'me': return router.push(ROUTES.APP_ME);
          case 'create': return router.push(ROUTES.APP_CREATE);
        }
      }}
    />
  );
}
