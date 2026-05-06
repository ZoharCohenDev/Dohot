import { useRouter } from 'expo-router';
import { DocumentsScreen } from '@/screens/output/DocumentsScreen';

export default function DocumentsPage() {
  const router = useRouter();
  return (
    <DocumentsScreen
      onNavigate={(tab) => {
        switch (tab) {
          case 'home': return router.push('/(app)');
          case 'customers': return router.push('/(app)/customers');
          case 'me': return router.push('/(app)/me');
          case 'create': return router.push('/(app)/wizard/customer');
        }
      }}
    />
  );
}
