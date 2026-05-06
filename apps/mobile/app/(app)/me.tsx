import React from 'react';
import { useRouter } from 'expo-router';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { ROUTES } from '@/navigation/constants';

export default function MePage() {
  const [dark, setDark] = React.useState(false);
  const router = useRouter();
  return (
    <SettingsScreen
      dark={dark}
      onToggleTheme={() => setDark((d) => !d)}
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
