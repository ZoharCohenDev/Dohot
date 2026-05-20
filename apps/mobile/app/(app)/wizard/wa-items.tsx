import { WaItemsStep } from '@/screens/wizard/WaItemsStep';
import { useColors } from '@/theme';

export default function WaItemsPage() {
  const colors = useColors();
  return <WaItemsStep colors={colors} />;
}
