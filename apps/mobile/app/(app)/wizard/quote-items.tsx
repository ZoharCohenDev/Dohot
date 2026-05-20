import { QuoteItemsStep } from '@/screens/wizard/QuoteItemsStep';
import { useColors } from '@/theme';

export default function WizardQuoteItemsPage() {
  const colors = useColors();
  return <QuoteItemsStep colors={colors} />;
}
