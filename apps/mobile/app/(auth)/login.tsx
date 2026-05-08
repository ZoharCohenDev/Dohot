import { useRouter } from 'expo-router';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { ROUTES } from '@/navigation/constants';
import { supabase, tables } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  const handleLoggedIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(ROUTES.APP_HOME); return; }

      const { data: profile } = await supabase
        .from(tables.businessProfiles)
        .select('role, is_active, subscription_expiration_date')
        .eq('id', user.id)
        .single();

      const role = profile?.role as string | null;
      const isActive = profile?.is_active ?? true;

      if (!isActive) {
        router.replace(ROUTES.AUTH_EXPIRED);
        return;
      }

      if (role !== 'admin' && profile?.subscription_expiration_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(profile.subscription_expiration_date);
        expiry.setHours(0, 0, 0, 0);
        if (expiry < today) {
          router.replace(ROUTES.AUTH_EXPIRED);
          return;
        }
      }

      router.replace(role === 'admin' ? ROUTES.ADMIN_HOME : ROUTES.APP_HOME);
    } catch (e) {
      console.log('[LOGIN] error:', e);
      router.replace(ROUTES.APP_HOME);
    }
  };

  return <LoginScreen onLoggedIn={handleLoggedIn} />;
}
