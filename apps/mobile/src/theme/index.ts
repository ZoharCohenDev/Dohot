export * from './tokens';

import { lightColors, darkColors, type Colors } from './tokens';
import { useSettings } from '@/context/SettingsContext';

export function getColors(dark: boolean): Colors {
  return dark ? darkColors : lightColors;
}

export function useColors(): typeof lightColors {
  const { dark } = useSettings();
  return getColors(dark) as typeof lightColors;
}
