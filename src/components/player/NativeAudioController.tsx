import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { createVideoPlayer } from 'expo-video';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useEqualizerStore } from '../../store/useEqualizerStore';
import { useSleepTimerStore } from '../../store/useSleepTimerStore';
import { useVideoSyncStore } from '../../store/useVideoSyncStore';
import { cloudService } from '../../services/supabase/cloudService';
import { musicApiService } from '../../services/api/musicApiService';

/**
 * Universal Native Player Engine using `expo-video`'s robust ExoPlayer core.
 * Delivers hardware audio decoding, automatic audio focus, and smooth playback.
 * Safely shows lock-screen & notification cards while app is active in the foreground!
 */
export const NativeAudioController: React.FC = () => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const playbackStatus = usePlayerStore((s) => s.playbackStatus);
  const nextTrack = usePlayerStore((s) => s.nextTrack);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const playerRef = useRef<any>(null);
  const lastReportedSecRef = useRef<number>(-1);
  const currentLoadedUrlRef = useRef<string>('');
  const isSwitchingTrackRef = useRef<boolean>(false);

  // 1. Manage track loading / switching with the native player
  useEffect(() => {
    if (!currentTrack) return;
    let isMounted = true;

    const prepareAndPlay = async () => {
      const resolvedUrl = await musicApiService.resolvePlayableStream(currentTrack);
      if (!isMounted) return;

      const mediaUrl = resolvedUrl || currentTrack.mediaUrl;
      if (!mediaUrl) return;

      const secureUrl = mediaUrl.startsWith('http://')
        ? mediaUrl.replace('http://', 'https://')
        : mediaUrl;

      if (currentLoadedUrlRef.current === secureUrl && playerRef.current) {
        return;
      }

      currentLoadedUrlRef.current = secureUrl;
      lastReportedSecRef.current = -1;
      isSwitchingTrackRef.current = true;

      // Reset store position to 0 immediately
      usePlayerStore.getState().updatePlaybackPosition(0, currentTrack?.duration || 0);

      // Automatically record to cloud user_history in database
      cloudService.logPlayHistory(currentTrack);

    const videoSource = {
      uri: secureUrl,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://www.jiosaavn.com/',
        Accept: '*/*',
      },
      metadata: {
        title: currentTrack?.title || 'Musify Track',
        artist: currentTrack?.artist || 'Unknown Artist',
        artwork: currentTrack?.artworkUrl || '',
      },
    };

    if (!playerRef.current) {
      try {
        const player = createVideoPlayer(videoSource);
        playerRef.current = player;
        useVideoSyncStore.getState().setPlayerInstance(player);
        player.volume = 1.0;
        player.muted = false;
        player.timeUpdateEventInterval = 0.5;

        // Auto audio focus: pauses automatically when YouTube/Spotify/other apps play
        player.audioMixingMode = 'auto';
        player.loop = repeatMode === 'one';

        // Safely enable Now Playing notification only when app is in the foreground
        if (AppState.currentState === 'active') {
          player.showNowPlayingNotification = true;
          player.staysActiveInBackground = true;
        }

        player.bufferOptions = {
          minBufferForPlayback: 0.5,
          preferredForwardBufferDuration: 15,
        };

        player.addListener('statusChange', (event: any) => {
          if (event.status === 'readyToPlay') {
            if (isSwitchingTrackRef.current) {
              player.currentTime = 0;
              isSwitchingTrackRef.current = false;
            }
            usePlayerStore.getState().setPlaybackStatus('playing');
            player.play();
          } else if (event.status === 'loading') {
            usePlayerStore.getState().setPlaybackStatus('buffering');
          }
        });

        player.addListener('playingChange', (event: any) => {
          // If the system or notification pauses playback, sync state
          if (!event.isPlaying && usePlayerStore.getState().playbackStatus === 'playing') {
            if (!isSwitchingTrackRef.current && player.status === 'readyToPlay') {
              usePlayerStore.getState().setPlaybackStatus('paused');
            }
          }
        });

        player.addListener('timeUpdate', (event: any) => {
          if (isSwitchingTrackRef.current) return;

          const currentSec = Math.floor(event.currentTime || 0);
          const durationSec = Math.floor(player.duration || 0);

          if (currentSec !== lastReportedSecRef.current && (currentSec > 0 || durationSec > 0)) {
            lastReportedSecRef.current = currentSec;
            usePlayerStore.getState().updatePlaybackPosition(currentSec, durationSec);

            // 1. Crossfade attenuation over final seconds
            const crossfadeSec = useEqualizerStore.getState().crossfadeDuration;
            let crossfadeMultiplier = 1.0;
            if (crossfadeSec > 0 && durationSec > crossfadeSec) {
              const remainingSec = durationSec - currentSec;
              if (remainingSec <= crossfadeSec) {
                // Smooth power attenuation curve down towards next track
                const ratio = Math.max(0.0, remainingSec / crossfadeSec);
                crossfadeMultiplier = Math.pow(ratio, 1.4);
              }
            }

            // 2. Sleep timer volume fadeout integration
            const sleepFadeVolume = useSleepTimerStore.getState().currentFadeVolume;

            // Combine EQ base volume, crossfade curve, and sleep timer fade
            const effectiveVol = Math.max(0.0, Math.min(1.0, crossfadeMultiplier * sleepFadeVolume));
            player.volume = effectiveVol;
          }
        });

        player.addListener('playToEnd', () => {
          if (usePlayerStore.getState().repeatMode === 'one') {
            player.currentTime = 0;
            player.play();
          } else {
            nextTrack();
          }
        });

        player.currentTime = 0;
        player.play();
      } catch (err) {
        console.error('Error creating native player:', err);
      }
    } else {
      try {
        const player = playerRef.current;
        player.audioMixingMode = 'auto';
        player.loop = repeatMode === 'one';
        if (AppState.currentState === 'active') {
          player.showNowPlayingNotification = true;
          player.staysActiveInBackground = true;
        }
        player.replace(videoSource);
        player.currentTime = 0;
        player.volume = 1.0;
        player.muted = false;
        player.play();
      } catch (err) {
        console.warn('Error replacing track source:', err);
      }
    }
    };
    prepareAndPlay();
    return () => { isMounted = false; };
  }, [currentTrack?.id, currentTrack?.mediaUrl]);

  // 2. Play / Pause Store Sync
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (playbackStatus === 'playing') {
        player.volume = 1.0;
        player.muted = false;
        player.play();
      } else if (playbackStatus === 'paused') {
        player.pause();
      }
    } catch (e) {}
  }, [playbackStatus]);

  // 3. Repeat Mode Sync
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.loop = repeatMode === 'one';
    }
  }, [repeatMode]);

  // 4. Seek Control
  const position = usePlayerStore((s) => s.position);
  useEffect(() => {
    const player = playerRef.current;
    if (!player || isSwitchingTrackRef.current) return;

    try {
      const currentSec = Math.floor(player.currentTime || 0);
      if (Math.abs(currentSec - position) > 2) {
        player.currentTime = position;
      }
    } catch (e) {}
  }, [position]);

  // 5. Dynamic Equalizer, Preamp Gain & Sleep Timer Volume Sync
  const isEqEnabled = useEqualizerStore((s) => s.isEnabled);
  const bands = useEqualizerStore((s) => s.bands);
  const bassBoost = useEqualizerStore((s) => s.bassBoost);
  const sleepFadeVolume = useSleepTimerStore((s) => s.currentFadeVolume);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (!isEqEnabled) {
        player.volume = sleepFadeVolume;
        return;
      }

      // Calculate aggregate gain offset from EQ bands (-12 to +12 dB)
      const avgGain = bands.reduce((acc, g) => acc + g, 0) / (bands.length || 10);
      const bassInfluence = (bassBoost / 100) * 3; // +0 to +3 dB equivalent
      const netDb = avgGain + bassInfluence;

      // Linear amplitude scale: 10^(dB / 20)
      const eqVolume = Math.max(0.35, Math.min(1.0, Math.pow(10, netDb / 28)));
      player.volume = Math.max(0.0, Math.min(1.0, eqVolume * sleepFadeVolume));
    } catch (e) {
      console.warn('Equalizer sync error:', e);
    }
  }, [isEqEnabled, bands, bassBoost, sleepFadeVolume]);

  // 6. Seamless Video Quality Hot-Swap at Exact Millisecond Position
  const isVideoTabActive = useVideoSyncStore((s) => s.isVideoTabActive);
  const targetQuality = isVideoTabActive ? 'high' : 'low';

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !currentTrack) return;

    // Determine target URL for requested quality
    const targetUrl = isVideoTabActive
      ? currentTrack.highQualityVideoUrl || currentTrack.mediaUrl
      : currentTrack.lowQualityVideoUrl || currentTrack.mediaUrl;

    if (!targetUrl || currentLoadedUrlRef.current === targetUrl) {
      return;
    }

    const savedPosition = player.currentTime || 0;
    const wasPlaying = usePlayerStore.getState().playbackStatus === 'playing';

    currentLoadedUrlRef.current = targetUrl;
    useVideoSyncStore.getState().setIsQualitySwapping(true);

    const swappedSource = {
      uri: targetUrl,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://www.jiosaavn.com/',
        Accept: '*/*',
      },
      metadata: {
        title: currentTrack.title,
        artist: currentTrack.artist,
        artwork: currentTrack.artworkUrl,
      },
    };

    try {
      player.replace(swappedSource);
      player.currentTime = savedPosition;
      if (wasPlaying) {
        player.play();
      }
    } catch (err) {
      console.warn('Seamless quality swap error:', err);
    } finally {
      setTimeout(() => {
        useVideoSyncStore.getState().setIsQualitySwapping(false);
      }, 350);
    }
  }, [isVideoTabActive, currentTrack?.id]);

  return null;
};
