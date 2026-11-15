export type AccentColor =
  | 'obsidianGlass'
  | 'pearlGlass'
  | 'midnightLuxe';

export type ThemeMode = 'oled' | 'dark' | 'light' | 'system';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  glow: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceBorder: string;
  surfaceCard: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  error: string;
  success: string;
  isLight: boolean;
}

export const ACCENT_PALETTES: Record<
  AccentColor,
  {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    glow: string;
    label: string;
    sublabel: string;
    previewGradient: [string, string];
  }
> = {
  obsidianGlass: {
    label: 'Obsidian',
    sublabel: 'Default • Soft Silver & Muted Steel Blue',
    primary: '#B8C0CC',
    primaryLight: '#F0F1F4',
    primaryDark: '#71869F',
    glow: 'rgba(184, 192, 204, 0.18)',
    previewGradient: ['#B8C0CC', '#08090B'],
  },
  pearlGlass: {
    label: 'Pearl Glass',
    sublabel: 'Luminescent Oyster & Pearl White Frost',
    primary: '#E9EBF0',
    primaryLight: '#FAF7F2',
    primaryDark: '#A8A195',
    glow: 'rgba(233, 235, 240, 0.22)',
    previewGradient: ['#E9EBF0', '#1A1B20'],
  },
  midnightLuxe: {
    label: 'Midnight Luxe',
    sublabel: 'Deep Navy & Warm Champagne Gold',
    primary: '#C5A869',
    primaryLight: '#DFCA94',
    primaryDark: '#1E293B',
    glow: 'rgba(197, 168, 105, 0.22)',
    previewGradient: ['#C5A869', '#0B1120'],
  },
};

export const getThemeColors = (
  accent: AccentColor = 'obsidianGlass',
  mode: ThemeMode = 'dark'
): ThemeColors => {
  const selectedAccent = ACCENT_PALETTES[accent] || ACCENT_PALETTES.obsidianGlass;

  return {
    primary: selectedAccent.primary,
    primaryLight: selectedAccent.primaryLight,
    primaryDark: selectedAccent.primaryDark,
    glow: selectedAccent.glow,
    background: '#08090B', // Deep Luxury Canvas
    surface: 'rgba(255, 255, 255, 0.045)',
    surfaceElevated: 'rgba(255, 255, 255, 0.07)',
    surfaceBorder: 'rgba(255, 255, 255, 0.12)',
    surfaceCard: 'rgba(255, 255, 255, 0.045)',
    textPrimary: '#F0F1F4',
    textSecondary: '#969BA5',
    textMuted: 'rgba(255, 255, 255, 0.38)',
    accent: '#AAB8CA',
    error: 'rgba(255, 255, 255, 0.70)',
    success: 'rgba(255, 255, 255, 0.85)',
    isLight: false,
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
  radiusSm: 10,
  radiusMd: 16,
  radiusLg: 24,
  radiusPill: 9999,
};
