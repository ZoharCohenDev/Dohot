import { WaPriceStep } from '@/screens/wizard/WaPriceStep';
import { useColors } from '@/theme';

export default function WaPricePage() {
  const colors = useColors();
  return <WaPriceStep colors={colors} />;
}
