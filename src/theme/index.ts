export * from './tokens';

import { lightColors, darkColors, type Colors } from './tokens';

export function getColors(dark: boolean): Colors {
  return dark ? darkColors : lightColors;
}
