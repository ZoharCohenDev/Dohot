import { WaPaymentStep } from '@/screens/wizard/WaPaymentStep';
import { useColors } from '@/theme';

export default function WaPaymentPage() {
  const colors = useColors();
  return <WaPaymentStep colors={colors} />;
}
