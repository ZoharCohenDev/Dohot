import { useRouter } from 'expo-router';
import { DocumentsScreen } from '@/screens/output/DocumentsScreen';
import { ROUTES } from '@/navigation/constants';

export default function DocumentsPage() {
  const router = useRouter();
  return (
    <DocumentsScreen
      onNavigate={(tab) => {
        switch (tab) {
          case 'home': return router.push(ROUTES.APP_HOME);
          case 'customers': return router.push(ROUTES.APP_CUSTOMERS);
          case 'me': return router.push(ROUTES.APP_ME);
          case 'create': return router.push(ROUTES.APP_CREATE);
        }
      }}
    />
  );
}
