import { useRouter } from 'expo-router';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { ROUTES } from '@/navigation/constants';
import { useColors } from '@/theme';

export default function DashboardPage() {
  const router = useRouter();
  const colors = useColors();
  return (
    <DashboardScreen
      colors={colors}
      onCreateReport={() => router.push(ROUTES.WIZARD_VOICE_IDLE)}
      onCreateType={() => router.push(ROUTES.APP_CREATE)}
      onNavigate={(tab) => {
        switch (tab) {
          case 'docs': return router.push(ROUTES.APP_DOCUMENTS);
          case 'customers': return router.push(ROUTES.APP_CUSTOMERS);
          case 'me': return router.push(ROUTES.APP_ME);
          case 'create': return router.push(ROUTES.APP_CREATE);
        }
      }}
    />
  );
}
