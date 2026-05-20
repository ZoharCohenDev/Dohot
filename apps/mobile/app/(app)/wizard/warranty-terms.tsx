import { WarrantyTermsStep } from '@/screens/wizard/WarrantyTermsStep';
import { useColors } from '@/theme';

export default function WizardWarrantyTermsPage() {
  const colors = useColors();
  return <WarrantyTermsStep colors={colors} />;
}
