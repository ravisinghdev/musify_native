import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePlayerStore } from './usePlayerStore';

const STORAGE_KEY_SLEEP = '@musify_sleep_timer_preset';

export type SleepTimerOption = 
  | 'off'
  | 'end_of_track'
  | 5   // 5 mins
  | 10  // 10 mins
  | 15  // 15 mins
  | 30  // 30 mins
  | 45  // 45 mins
  | 60; // 60 mins

interface SleepTimerState {
  isActive: boolean;
  selectedOption: SleepTimerOption;
  remainingSeconds: number;
  totalDurationSeconds: number;
  fadeDurationSeconds: number; // Duration of gentle volume fade before sleep (default 30s)
  currentFadeVolume: number; // Multiplier from 1.0 down to 0.0 during fadeout
  
  // Actions
  setTimer: (option: SleepTimerOption) => void;
  cancelTimer: () => void;
  tickSecond: () => void;
  triggerSleep: () => void;
}

let timerInterval: any = null;

export const useSleepTimerStore = create<SleepTimerState>((set, get) => ({
  isActive: false,
  selectedOption: 'off',
  remainingSeconds: 0,
  totalDurationSeconds: 0,
  fadeDurationSeconds: 30, // 30 second smooth volume fadeout
  currentFadeVolume: 1.0,

  setTimer: (option: SleepTimerOption) => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (option === 'off') {
      set({
        isActive: false,
        selectedOption: 'off',
        remainingSeconds: 0,
        totalDurationSeconds: 0,
        currentFadeVolume: 1.0,
      });
      return;
    }

    if (option === 'end_of_track') {
      const { position, duration } = usePlayerStore.getState();
      const remainingTrackSec = Math.max(5, duration - position);

      set({
        isActive: true,
        selectedOption: 'end_of_track',
        remainingSeconds: remainingTrackSec,
        totalDurationSeconds: remainingTrackSec,
        fadeDurationSeconds: Math.min(15, remainingTrackSec),
        currentFadeVolume: 1.0,
      });
    } else {
      const seconds = option * 60;
      set({
        isActive: true,
        selectedOption: option,
        remainingSeconds: seconds,
        totalDurationSeconds: seconds,
        fadeDurationSeconds: Math.min(30, seconds / 2),
        currentFadeVolume: 1.0,
      });
    }

    timerInterval = setInterval(() => {
      get().tickSecond();
    }, 1000);
  },

  cancelTimer: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    set({
      isActive: false,
      selectedOption: 'off',
      remainingSeconds: 0,
      totalDurationSeconds: 0,
      currentFadeVolume: 1.0,
    });
  },

  tickSecond: () => {
    const { remainingSeconds, fadeDurationSeconds, selectedOption } = get();

    // If "end_of_track", dynamically track current song remaining time
    if (selectedOption === 'end_of_track') {
      const { position, duration, playbackStatus } = usePlayerStore.getState();
      if (playbackStatus !== 'playing') return;

      const remainingTrackSec = Math.max(0, duration - position);
      
      if (remainingTrackSec <= 0) {
        get().triggerSleep();
        return;
      }

      // Compute gentle power-curve fade in the last 15 seconds
      const fadeLimit = Math.min(15, duration / 4);
      let fadeFactor = 1.0;
      if (remainingTrackSec <= fadeLimit && fadeLimit > 0) {
        fadeFactor = Math.max(0.0, remainingTrackSec / fadeLimit);
      }

      set({
        remainingSeconds: remainingTrackSec,
        currentFadeVolume: Math.pow(fadeFactor, 1.5), // Natural logarithmic audio taper
      });
      return;
    }

    if (remainingSeconds <= 1) {
      get().triggerSleep();
    } else {
      const nextRemaining = remainingSeconds - 1;
      let fadeFactor = 1.0;

      // When within fadeout window (e.g. final 30 seconds)
      if (nextRemaining <= fadeDurationSeconds && fadeDurationSeconds > 0) {
        fadeFactor = Math.max(0.0, nextRemaining / fadeDurationSeconds);
      }

      set({
        remainingSeconds: nextRemaining,
        currentFadeVolume: Math.pow(fadeFactor, 1.5), // Smooth acoustic fade curve
      });
    }
  },

  triggerSleep: () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // Pause audio playback smoothly
    usePlayerStore.getState().setPlaybackStatus('paused');

    set({
      isActive: false,
      selectedOption: 'off',
      remainingSeconds: 0,
      totalDurationSeconds: 0,
      currentFadeVolume: 1.0,
    });
  },
}));

