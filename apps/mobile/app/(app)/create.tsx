import { useRouter } from 'expo-router';
import { CreateDocumentTypeScreen } from '@/screens/dashboard/CreateDocumentTypeScreen';
import { ROUTES } from '@/navigation/constants';
import type { DocType } from '@/config/documentTypes';

export default function CreatePage() {
  const router = useRouter();

  const handleSelectType = (docType: DocType) => {
    router.push(`${ROUTES.WIZARD_CUSTOMER}?docType=${docType}` as never);
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
