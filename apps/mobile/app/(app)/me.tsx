import { useRouter } from 'expo-router';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { ROUTES } from '@/navigation/constants';
import { useColors } from '@/theme';
import { useSettings } from '@/context/SettingsContext';

export default function MePage() {
  const { dark, toggleTheme } = useSettings();
  const colors = useColors();
  const router = useRouter();

  return (
    <SettingsScreen
      dark={dark}
      colors={colors}
      onToggleTheme={toggleTheme}
      onNavigate={(tab) => {
        switch (tab) {
          case 'home': return router.push(ROUTES.APP_HOME);
          case 'docs': return router.push(ROUTES.APP_DOCUMENTS);
          case 'customers': return router.push(ROUTES.APP_CUSTOMERS);
          case 'create': return router.push(ROUTES.APP_CREATE);
        }
      }}
    />
  );
}
