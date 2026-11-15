import { create } from 'zustand';

export interface EqBand {
  id: number;
  frequency: string; // e.g. "31Hz", "62Hz", "125Hz", "250Hz", "500Hz", "1kHz", "2kHz", "4kHz", "8kHz", "16kHz"
  gain: number; // in dB: -12dB to +12dB
}

export type EqPreset =
  | 'Flat'
  | 'Bass Boost'
  | 'Vocal Boost'
  | 'Electronic'
  | 'Rock'
  | 'Pop'
  | 'Acoustic'
  | 'Hip-Hop'
  | 'Jazz'
  | 'Classical'
  | 'Custom';

export const EQ_FREQUENCIES = [
  '31Hz',
  '62Hz',
  '125Hz',
  '250Hz',
  '500Hz',
  '1kHz',
  '2kHz',
  '4kHz',
  '8kHz',
  '16kHz',
];

export const PRESET_VALUES: Record<EqPreset, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [8, 7, 5, 2, 0, 0, 0, 1, 2, 2],
  'Vocal Boost': [-2, -1, 0, 2, 5, 6, 4, 2, 0, -1],
  Electronic: [6, 5, 2, 0, -2, 2, 1, 3, 5, 6],
  Rock: [5, 3, -1, -2, 1, 3, 4, 5, 5, 6],
  Pop: [-1, 1, 3, 4, 5, 3, 0, 1, 3, 4],
  Acoustic: [3, 2, 1, 2, 3, 3, 4, 4, 3, 2],
  'Hip-Hop': [7, 6, 3, 1, -1, -1, 2, 1, 3, 4],
  Jazz: [3, 2, 1, 2, -1, -1, 0, 2, 3, 4],
  Classical: [4, 3, 2, 2, -1, -1, 0, 2, 3, 3],
  Custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

interface EqualizerState {
  isEnabled: boolean;
  selectedPreset: EqPreset;
  bands: number[]; // 10 band gains in dB (-12 to +12)
  bassBoost: number; // 0 to 100%
  virtualizer: number; // 0 to 100%
  crossfadeDuration: number; // in seconds: 0 (off) to 12s
  isGapless: boolean;

  // Actions
  toggleEqualizer: () => void;
  setPreset: (preset: EqPreset) => void;
  setBandGain: (index: number, gain: number) => void;
  setBassBoost: (val: number) => void;
  setVirtualizer: (val: number) => void;
  setCrossfadeDuration: (seconds: number) => void;
  toggleGapless: () => void;
  resetToFlat: () => void;
}

export const useEqualizerStore = create<EqualizerState>((set, get) => ({
  isEnabled: true,
  selectedPreset: 'Bass Boost',
  bands: [...PRESET_VALUES['Bass Boost']],
  bassBoost: 40,
  virtualizer: 25,
  crossfadeDuration: 4,
  isGapless: true,

  toggleEqualizer: () => set((s) => ({ isEnabled: !s.isEnabled })),

  setPreset: (preset) => {
    set({
      selectedPreset: preset,
      bands: [...PRESET_VALUES[preset]],
    });
  },

  setBandGain: (index, gain) => {
    const clamped = Math.max(-12, Math.min(12, gain));
    const newBands = [...get().bands];
    newBands[index] = clamped;
    set({
      bands: newBands,
      selectedPreset: 'Custom',
    });
  },

  setBassBoost: (val) => set({ bassBoost: Math.max(0, Math.min(100, val)) }),
  setVirtualizer: (val) => set({ virtualizer: Math.max(0, Math.min(100, val)) }),
  setCrossfadeDuration: (sec) => set({ crossfadeDuration: Math.max(0, Math.min(12, sec)) }),
  toggleGapless: () => set((s) => ({ isGapless: !s.isGapless })),

  resetToFlat: () =>
    set({
      selectedPreset: 'Flat',
      bands: [...PRESET_VALUES['Flat']],
      bassBoost: 0,
      virtualizer: 0,
    }),
}));

