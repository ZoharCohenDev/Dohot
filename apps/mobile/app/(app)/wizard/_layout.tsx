import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { WizardProvider, useWizard } from '@/context/WizardContext';
import { loadWizardDraft } from '@/services/wizardDraft';

/**
 * Checks for a persisted wizard draft before rendering steps.
 * Renders null while the check is in-flight so step screens mount
 * only after the context is fully hydrated from the draft (if any).
 */
function WizardRestoreGate({ children }: { children: React.ReactNode }) {
  const { discardDraft } = useWizard();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadWizardDraft().then((draft) => {
      if (!mounted) return;
      if (draft && draft.customerName) {
        discardDraft();
      }
      setReady(true);
    });
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}

export default function WizardLayout() {
  return (
    <WizardProvider>
      <WizardRestoreGate>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_left',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        />
      </WizardRestoreGate>
    </WizardProvider>
  );
}
