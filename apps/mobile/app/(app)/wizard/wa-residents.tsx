import { WaResidentsStep } from '@/screens/wizard/WaResidentsStep';
import { useColors } from '@/theme';

export default function WaResidentsPage() {
  const colors = useColors();
  return <WaResidentsStep colors={colors} />;
}
