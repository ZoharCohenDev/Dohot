import { useRouter } from 'expo-router';
import { AddIssueScreen } from '@/screens/wizard/AddIssueScreen';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';
import { useWizard } from '@/context/WizardContext';
import { useColors } from '@/theme';

export default function WizardAddIssuePage() {
  const router = useRouter();
  const wizard = useWizard();
  const colors = useColors();

  const handleAddIssue = () => {
    wizard.addNewIssue();
    router.push(ROUTES.WIZARD_ISSUE);
  };

  const handleFinish = () => {
    router.push(ROUTES.WIZARD_PROCESSING);
  };

  return (
    <AddIssueScreen
      colors={colors}
      onAddIssue={handleAddIssue}
      onFinish={handleFinish}
      onBack={() => safeBack(router, ROUTES.WIZARD_TRANSCRIPT)}
    />
  );
}
