import { useLocalSearchParams } from 'expo-router';
import { CustomerStep } from '@/screens/wizard/CustomerStep';
import { useAuth } from '@/context/AuthContext';
import { useWizard } from '@/context/WizardContext';
import { useEffect } from 'react';
import type { DocType } from '@/config/documentTypes';

export default function WizardCustomerPage() {
  const { businessProfile } = useAuth();
  const wizard = useWizard();
  const { docType } = useLocalSearchParams<{ docType?: string }>();

  useEffect(() => {
    if (docType) wizard.setDocType(docType as DocType);
  }, [docType]);

  return (
    <CustomerStep professionalId={businessProfile?.id} />
  );
}
