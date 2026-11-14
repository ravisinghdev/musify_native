import { create } from 'zustand';
import { Track, PlaybackStatus, RepeatMode } from '../types/models';

interface PlayerState {
  currentTrack: Track | null;
  playbackStatus: PlaybackStatus;
  position: number;
  duration: number;
  queue: Track[];
  queueIndex: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isFullPlayerVisible: boolean;
  isVideoMode: boolean;

  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seekTo: (position: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setFullPlayerVisible: (visible: boolean) => void;
  setVideoMode: (enabled: boolean) => void;
  updatePlaybackPosition: (position: number, duration: number) => void;
  setPlaybackStatus: (status: PlaybackStatus) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  playbackStatus: 'idle',
  position: 0,
  duration: 0,
  queue: [],
  queueIndex: 0,
  isShuffle: false,
  repeatMode: 'off',
  isFullPlayerVisible: false,
  isVideoMode: false,

  playTrack: (track, newQueue) => {
    const queue = newQueue || get().queue;
    const finalQueue = queue.length > 0 && queue.some((t) => t.id === track.id) 
      ? queue 
      : [track, ...queue];
    const index = finalQueue.findIndex((t) => t.id === track.id);

    set({
      currentTrack: track,
      queue: finalQueue,
      queueIndex: index >= 0 ? index : 0,
      playbackStatus: 'playing',
      position: 0,
      duration: track.duration,
      isVideoMode: track.type === 'video',
    });
  },

  togglePlayPause: () => {
    const { playbackStatus } = get();
    set({
      playbackStatus: playbackStatus === 'playing' ? 'paused' : 'playing',
    });
  },

  nextTrack: () => {
    const { queue, queueIndex, repeatMode, isShuffle } = get();
    if (queue.length === 0) return;

    if (repeatMode === 'one') {
      set({ position: 0, playbackStatus: 'playing' });
      return;
    }

    let nextIndex = queueIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        set({ playbackStatus: 'paused' });
        return;
      }
    }

    const nextTrackItem = queue[nextIndex];
    if (nextTrackItem) {
      set({
        currentTrack: nextTrackItem,
        queueIndex: nextIndex,
        position: 0,
        duration: nextTrackItem.duration,
        playbackStatus: 'playing',
        isVideoMode: nextTrackItem.type === 'video',
      });
    }
  },

  previousTrack: () => {
    const { queue, queueIndex, position } = get();
    if (position > 3) {
      set({ position: 0 });
      return;
    }
    const prevIndex = queueIndex > 0 ? queueIndex - 1 : 0;
    const prevTrackItem = queue[prevIndex];
    if (prevTrackItem) {
      set({
        currentTrack: prevTrackItem,
        queueIndex: prevIndex,
        position: 0,
        duration: prevTrackItem.duration,
        playbackStatus: 'playing',
        isVideoMode: prevTrackItem.type === 'video',
      });
    }
  },

  seekTo: (position) => set({ position }),

  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),

  toggleRepeat: () => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const current = get().repeatMode;
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    set({ repeatMode: next });
  },

  setFullPlayerVisible: (visible) => set({ isFullPlayerVisible: visible }),

  setVideoMode: (enabled) => set({ isVideoMode: enabled }),

  updatePlaybackPosition: (position, duration) => set({ position, duration }),

  setPlaybackStatus: (status) => set({ playbackStatus: status }),
}));

