import { useRouter } from 'expo-router';
import { CustomerStep } from '@/screens/wizard/CustomerStep';

export default function WizardCustomerPage() {
  const router = useRouter();
  return (
    <CustomerStep
      onNext={() => router.push('/(app)/wizard/issue')}
      onBack={() => router.back()}
    />
  );
}
