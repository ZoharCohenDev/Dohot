import React from 'react';
import { useRouter } from 'expo-router';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { ROUTES } from '@/navigation/constants';
import { getColors, lightColors } from '@/theme';

export default function MePage() {
  const [dark, setDark] = React.useState(false);
  // getColors returns Colors union; cast is safe since both themes share the same shape
  const colors = getColors(dark) as typeof lightColors;
  const router = useRouter();
  return (
    <SettingsScreen
      dark={dark}
      colors={colors}
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
