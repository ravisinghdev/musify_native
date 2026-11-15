import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Universal Haptic Service for Musify
 * Delivers crisp tactile feedback on interactive events (play/pause, track taps, tab switches, scrubbers).
 */
export const hapticFeedback = {
  // Light tick for tab bar switches & chips
  selection: () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch (e) {}
    }
  },

  // Soft tactile bump for button taps, like hearting, skip
  light: () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  },

  // Satisfying solid thud for big Play/Pause toggle
  medium: () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }
  },

  // Strong tactile response
  heavy: () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {}
    }
  },

  // Success indicator for actions like download or adding to playlist
  success: () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }
  },
};

