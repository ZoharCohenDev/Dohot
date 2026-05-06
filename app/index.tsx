import { Redirect } from 'expo-router';

// Entry point — redirect to onboarding.
// Replace with auth check when Supabase is wired up.
export default function Index() {
  const isAuthenticated = false; // TODO: derive from Supabase session

  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }
  return <Redirect href="/(auth)/welcome" />;
}
