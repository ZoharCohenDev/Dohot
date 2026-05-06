import React from 'react';
import { useRouter } from 'expo-router';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';

export default function MePage() {
  const [dark, setDark] = React.useState(false);
  const router = useRouter();
  return (
    <SettingsScreen
      dark={dark}
      onToggleTheme={() => setDark((d) => !d)}
      onNavigate={(tab) => {
        switch (tab) {
          case 'home': return router.push('/(app)');
          case 'docs': return router.push('/(app)/documents');
          case 'customers': return router.push('/(app)/customers');
          case 'create': return router.push('/(app)/wizard/customer');
        }
      }}
    />
  );
}
