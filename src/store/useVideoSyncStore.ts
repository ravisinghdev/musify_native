import { create } from 'zustand';

interface VideoSyncState {
  isVideoTabActive: boolean;
  videoQuality: 'low' | 'high';
  playerInstance: any | null;
  isQualitySwapping: boolean;
  setVideoTabActive: (active: boolean) => void;
  setVideoQuality: (quality: 'low' | 'high') => void;
  setPlayerInstance: (player: any | null) => void;
  setIsQualitySwapping: (swapping: boolean) => void;
}

export const useVideoSyncStore = create<VideoSyncState>((set) => ({
  isVideoTabActive: false,
  videoQuality: 'low',
  playerInstance: null,
  isQualitySwapping: false,
  setVideoTabActive: (active) => set({ isVideoTabActive: active, videoQuality: active ? 'high' : 'low' }),
  setVideoQuality: (quality) => set({ videoQuality: quality }),
  setPlayerInstance: (player) => set({ playerInstance: player }),
  setIsQualitySwapping: (swapping) => set({ isQualitySwapping: swapping }),
}));
