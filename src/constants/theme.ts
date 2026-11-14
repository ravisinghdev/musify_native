export type AccentColor = 'violet' | 'emerald' | 'cyan' | 'ruby' | 'gold';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  error: string;
  success: string;
}

export const ACCENT_PALETTES: Record<AccentColor, { primary: string; primaryLight: string; primaryDark: string }> = {
  violet: {
    primary: '#8B5CF6',
    primaryLight: '#A78BFA',
    primaryDark: '#6D28D9',
  },
  emerald: {
    primary: '#10B981',
    primaryLight: '#34D399',
    primaryDark: '#059669',
  },
  cyan: {
    primary: '#06B6D4',
    primaryLight: '#22D3EE',
    primaryDark: '#0891B2',
  },
  ruby: {
    primary: '#EF4444',
    primaryLight: '#F87171',
    primaryDark: '#B91C1C',
  },
  gold: {
    primary: '#F59E0B',
    primaryLight: '#FBBF24',
    primaryDark: '#D97706',
  },
};

export const getThemeColors = (accent: AccentColor = 'violet'): ThemeColors => {
  const selectedAccent = ACCENT_PALETTES[accent] || ACCENT_PALETTES.violet;

  return {
    primary: selectedAccent.primary,
    primaryLight: selectedAccent.primaryLight,
    primaryDark: selectedAccent.primaryDark,
    background: '#09090B', // Deep OLED dark
    surface: '#121216',
    surfaceElevated: '#1C1C24',
    surfaceBorder: '#272732',
    textPrimary: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    accent: selectedAccent.primary,
    error: '#F43F5E',
    success: '#10B981',
  };
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const SIZES = {
  radiusSm: 8,
  radiusMd: 14,
  radiusLg: 20,
  radiusFull: 9999,
  miniPlayerHeight: 64,
  bottomBarHeight: 60,
};

