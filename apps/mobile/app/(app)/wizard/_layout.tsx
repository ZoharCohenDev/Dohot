import { Stack } from 'expo-router';
import { WizardProvider } from '@/context/WizardContext';

export default function WizardLayout() {
  return (
    <WizardProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_left',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
    </WizardProvider>
  );
}
