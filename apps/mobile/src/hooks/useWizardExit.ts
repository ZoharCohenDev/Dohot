import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useWizard } from '@/context/WizardContext';
import { ROUTES } from '@/navigation/constants';

export function useWizardExit() {
  const router = useRouter();
  const wizard = useWizard();

  const triggerExit = () => {
    Alert.alert(
      'יציאה ללא שמירה',
      'האם לצאת ללא שמירה? הנתונים שהוזנו לא ישמרו.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'צא',
          style: 'destructive',
          onPress: () => {
            wizard.reset();
            router.replace(ROUTES.APP_HOME as never);
          },
        },
      ],
    );
  };

  return { triggerExit };
}
