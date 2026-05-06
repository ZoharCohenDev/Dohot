import { useRouter } from 'expo-router';
import { CreateDocumentTypeScreen } from '@/screens/dashboard/CreateDocumentTypeScreen';
import type { DocumentType } from '@/navigation/types';
import { ROUTES } from '@/navigation/constants';

export default function CreatePage() {
  const router = useRouter();

  const handleSelectType = (type: DocumentType) => {
    // Voice-first flow for reports; direct wizard for others
    if (type === 'report') {
      router.push(ROUTES.WIZARD_VOICE_IDLE);
    } else {
      router.push(ROUTES.WIZARD_CUSTOMER);
    }
  };

  return (
    <CreateDocumentTypeScreen
      onSelectType={handleSelectType}
      onNavigate={(tab) => {
        switch (tab) {
          case 'home': return router.push(ROUTES.APP_HOME);
          case 'docs': return router.push(ROUTES.APP_DOCUMENTS);
          case 'customers': return router.push(ROUTES.APP_CUSTOMERS);
          case 'me': return router.push(ROUTES.APP_ME);
        }
      }}
    />
  );
}
