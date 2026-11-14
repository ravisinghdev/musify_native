import { create } from 'zustand';
import { AccentColor, ThemeColors, getThemeColors } from '../constants/theme';

interface ThemeState {
  accent: AccentColor;
  colors: ThemeColors;
  setAccent: (accent: AccentColor) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  accent: 'violet',
  colors: getThemeColors('violet'),
  setAccent: (accent: AccentColor) => {
    set({
      accent,
      colors: getThemeColors(accent),
    });
  },
}));

