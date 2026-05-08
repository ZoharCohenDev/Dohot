import { useRouter, useLocalSearchParams } from 'expo-router';
import { OtpVerifyScreen } from '@/screens/auth/OtpVerifyScreen';
import { supabase, tables } from '@/lib/supabase';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';

export default function VerifyPage() {
  const router = useRouter();
  const { phone, name, profession } = useLocalSearchParams<{
    phone: string;
    name?: string;
    profession?: string;
  }>();

  const handleVerified = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from(tables.businessProfiles)
      .select('business_name')
      .eq('id', user.id)
      .single();

    const hasProfile = !!data?.business_name;

    if (hasProfile) {
      router.replace(ROUTES.APP_HOME);
    } else {
      router.replace({
        pathname: ROUTES.ONBOARDING_BUSINESS,
        params: { name: name ?? '', profession: profession ?? 'other' },
      });
    }
  };

  return (
    <OtpVerifyScreen
      phone={phone}
      onVerified={handleVerified}
      onBack={() => safeBack(router, ROUTES.AUTH_REGISTER)}
    />
  );
}
