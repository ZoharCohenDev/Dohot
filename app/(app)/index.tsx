import { useRouter } from 'expo-router';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';

export default function DashboardPage() {
  const router = useRouter();
  return (
    <DashboardScreen
      onCreateReport={() => router.push('/(app)/wizard/voice-idle')}
      onCreateType={() => router.push('/(app)/wizard/customer')}
      onNavigate={(tab) => {
        switch (tab) {
          case 'docs': return router.push('/(app)/documents');
          case 'customers': return router.push('/(app)/customers');
          case 'me': return router.push('/(app)/me');
          case 'create': return router.push('/(app)/wizard/customer');
        }
      }}
    />
  );
}
