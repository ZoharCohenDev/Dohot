import { useRouter } from 'expo-router';
import { AddIssueScreen } from '@/screens/wizard/AddIssueScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';
import { useWizard } from '@/context/WizardContext';

export default function WizardAddIssuePage() {
  const router = useRouter();
  const wizard = useWizard();

  const handleAddIssue = () => {
    wizard.addNewIssue();
    // Loop back to issue selection for the new issue
    router.push(ROUTES.WIZARD_ISSUE);
  };

  const handleFinish = () => {
    router.push(ROUTES.WIZARD_PROCESSING);
  };

  return (
    <AddIssueScreen
      onAddIssue={handleAddIssue}
      onFinish={handleFinish}
      onBack={() => safeBack(router, ROUTES.WIZARD_TRANSCRIPT)}
    />
  );
}
