// Tab navigator is rendered inside each screen directly using BottomNav component.
// We use a Stack here and let each screen render its own BottomNav overlay.
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
