import { Platform } from 'react-native';

// ─── Color palettes ───────────────────────────────────────────────────────────

export const lightColors = {
  // Cream paper backgrounds
  bg: '#F5F3EE',
  bgElev: '#FFFFFF',
  bgSunken: '#EFEDE7',
  bgTint: '#FAF8F4',

  // Ink
  ink1: '#1B1916',
  ink2: '#4A4641',
  ink3: '#807A72',
  ink4: '#B8B2A8',

  // Hairlines
  line: 'rgba(27, 25, 22, 0.08)',
  lineStrong: 'rgba(27, 25, 22, 0.14)',

  // Terracotta · primary action
  accent: '#C2613B',
  accent2: '#A04E2D',
  accentBg: '#F8E9DF',

  // Sage · AI / voice / success
  ai: '#5A8770',
  ai2: '#406854',
  aiBg: '#E5EDE7',

  // Sky · info
  info: '#4A7B9D',
  infoBg: '#E2EBF1',

  // Amber · warning
  warn: '#B8862B',
  warnBg: '#F4ECD7',

  // Crimson · danger
  danger: '#B33B2C',
  dangerBg: '#F5DDD8',
} as const;

export const darkColors = {
  bg: '#131210',
  bgElev: '#1E1C19',
  bgSunken: '#0E0D0B',
  bgTint: '#1A1815',

  ink1: '#F5F2EC',
  ink2: '#C7C1B6',
  ink3: '#8A857C',
  ink4: '#4A453E',

  line: 'rgba(245, 242, 236, 0.08)',
  lineStrong: 'rgba(245, 242, 236, 0.14)',

  accent: '#DB7E55',
  accent2: '#C2613B',
  accentBg: '#2B1C13',

  ai: '#84B097',
  ai2: '#5A8770',
  aiBg: '#1A2520',

  info: '#7AA9C7',
  infoBg: '#15212B',

  warn: '#D9A845',
  warnBg: '#2B2415',

  danger: '#D96355',
  dangerBg: '#2B1614',
} as const;

export type Colors = typeof lightColors | typeof darkColors;

// ─── Voice screen dark palette (always dark) ─────────────────────────────────

export const voiceColors = {
  bg: '#0F1612',
  auroraGreen: 'rgba(132, 176, 151, 0.20)',
  sageLight: '#84B097',
  sageDark: '#B8D4C2',
  transcriptBg: 'rgba(132, 176, 151, 0.08)',
  transcriptBorder: 'rgba(132, 176, 151, 0.20)',
  textPrimary: '#F5F2EC',
  textSecondary: '#C7C1B6',
  textMuted: '#807A72',
  ripple1: 'rgba(132, 176, 151, 0.18)',
  ripple2: 'rgba(132, 176, 151, 0.10)',
};

// ─── Typography ───────────────────────────────────────────────────────────────

export const fonts = {
  sans: 'Heebo',
  serif: 'FrankRuhlLibre',
} as const;

// ─── Spacing (4px base scale) ────────────────────────────────────────────────

export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s7: 32,
  s8: 40,
  s9: 56,
} as const;

// ─── Border radii ─────────────────────────────────────────────────────────────

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

// ─── Shadows (cross-platform) ─────────────────────────────────────────────────

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#1B1916',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#1B1916',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 5 },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#1B1916',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: { elevation: 10 },
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: '#1B1916',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: { elevation: 3 },
    default: {},
  }),
} as const;

// ─── Animation durations ─────────────────────────────────────────────────────

export const durations = {
  fast: 120,
  normal: 200,
  slow: 400,
  wave: 1400,
  aiPulse: 2000,
  orbit: 6000,
  shimmer: 3000,
} as const;
