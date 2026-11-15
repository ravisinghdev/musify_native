import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccentColor, ThemeColors, ThemeMode, getThemeColors, ACCENT_PALETTES } from '../constants/theme';

const ACCENT_STORAGE_KEY = '@musify_accent_color_v2';

interface ThemeState {
  accent: AccentColor;
  colors: ThemeColors;
  themeMode: ThemeMode;
  setAccent: (accent: AccentColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  loadSavedAccent: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  accent: 'obsidianGlass',
  themeMode: 'oled',
  colors: getThemeColors('obsidianGlass', 'oled'),
  setAccent: (accent: AccentColor) => {
    const validAccent = ACCENT_PALETTES[accent] ? accent : 'obsidianGlass';
    set({
      accent: validAccent,
      colors: getThemeColors(validAccent, get().themeMode),
    });
    AsyncStorage.setItem(ACCENT_STORAGE_KEY, validAccent).catch(() => {});
  },
  setThemeMode: (mode) => {
    set({
      themeMode: mode,
      colors: getThemeColors(get().accent, mode),
    });
  },
  loadSavedAccent: async () => {
    try {
      const saved = await AsyncStorage.getItem(ACCENT_STORAGE_KEY);
      if (saved && (saved in ACCENT_PALETTES)) {
        const validAccent = saved as AccentColor;
        set({
          accent: validAccent,
          colors: getThemeColors(validAccent, get().themeMode),
        });
      }
    } catch {
      // Default obsidianGlass
    }
  },
}));

// Automatically hydrate persisted accent on launch
useThemeStore.getState().loadSavedAccent();
