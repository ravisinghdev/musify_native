import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { usePlayerStore } from '../../store/usePlayerStore';

interface NativeAudioControllerProps {
  mediaUrl: string;
}

/**
 * NativeAudioController mounts a FRESH AudioPlayer instance whenever mediaUrl changes.
 * This completely avoids the known Android bug where player.replace() fails silently!
 */
export const NativeAudioController: React.FC<NativeAudioControllerProps> = ({ mediaUrl }) => {
  const { playbackStatus, updatePlaybackPosition, nextTrack } = usePlayerStore();

  const secureUrl = mediaUrl.startsWith('http://')
    ? mediaUrl.replace('http://', 'https://')
    : mediaUrl;

  const player = useAudioPlayer({ uri: secureUrl });
  const status = useAudioPlayerStatus(player);

  // Sync volume & initial playback
  useEffect(() => {
    if (player) {
      player.volume = 1.0;
      player.muted = false;
      player.play();
    }
  }, [player]);

  // Sync play / pause
  useEffect(() => {
    if (player) {
      if (playbackStatus === 'playing') {
        player.play();
      } else if (playbackStatus === 'paused') {
        player.pause();
      }
    }
  }, [playbackStatus, player]);

  // Sync position & auto-finish
  useEffect(() => {
    if (status) {
      if (typeof status.currentTime === 'number') {
        const dur = status.duration || 180;
        updatePlaybackPosition(status.currentTime, dur);
      }
      if (status.didJustFinish) {
        nextTrack();
      }
    }
  }, [status?.currentTime, status?.duration, status?.didJustFinish]);

  return null;
};
