import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { usePlayerStore } from './src/store/usePlayerStore';
import { youtubeService } from './src/services/youtube/youtubeService';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';

export default function App() {
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const {
    currentTrack,
    playbackStatus,
    setPlaybackStatus,
    updatePlaybackPosition,
    nextTrack,
    previousTrack,
    togglePlayPause,
    seekTo,
  } = usePlayerStore();

  // 1. Official Expo Audio React Hook
  // Passes null initially or currentTrack's stream URI when selected.
  // The hook automatically disposes native audio instances and handles C++ bindings safely across all Android & iOS versions!
  const player = useAudioPlayer(currentTrack?.mediaUrl ? { uri: currentTrack.mediaUrl } : null);
  const status = useAudioPlayerStatus(player);

  // 2. Global Audio mode configuration according to Expo SDK documentation
  useEffect(() => {
    if (Platform.OS !== 'web') {
      setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        interruptionModeAndroid: 'doNotMix',
        allowsRecording: false,
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      }).catch(console.error);
    }
  }, []);

  // 3. Reactively synchronize player status (currentTime, duration, auto-finish) with Musify store
  useEffect(() => {
    if (status && currentTrack) {
      if (typeof status.currentTime === 'number') {
        updatePlaybackPosition(
          status.currentTime,
          status.duration || currentTrack.duration
        );
      }

      if (status.didJustFinish) {
        nextTrack();
      }
    }
  }, [status?.currentTime, status?.duration, status?.didJustFinish]);

  // 4. Synchronize Play / Pause commands with the official AudioPlayer instance
  useEffect(() => {
    if (Platform.OS !== 'web' && player) {
      if (playbackStatus === 'playing') {
        player.play();
      } else if (playbackStatus === 'paused') {
        player.pause();
      }
    }

    // Web HTML5 Audio sync
    if (Platform.OS === 'web' && webAudioRef.current) {
      if (playbackStatus === 'playing') {
        webAudioRef.current.play().catch(console.error);
      } else if (playbackStatus === 'paused') {
        webAudioRef.current.pause();
      }
    }
  }, [playbackStatus, player]);

  // 5. Track source loading and URL resolution
  useEffect(() => {
    let isMounted = true;

    async function handleTrackChange() {
      if (!currentTrack) return;

      let playableUrl = currentTrack.mediaUrl;
      if (!playableUrl || (currentTrack.id && currentTrack.id.length === 11)) {
        try {
          playableUrl = await youtubeService.getStreamUrl(currentTrack.id);
        } catch (e) {
          playableUrl = currentTrack.mediaUrl;
        }
      }

      if (!playableUrl) return;

      // On Native Android/iOS: Update the hook's player with the new media stream
      if (Platform.OS !== 'web' && player) {
        try {
          // If URL is http, ensure https for Android 14+ network security
          const secureUrl = playableUrl.startsWith('http://') ? playableUrl.replace('http://', 'https://') : playableUrl;
          player.replace({ uri: secureUrl });
          player.volume = 1.0;
          player.muted = false;
          player.play();
          if (isMounted) setPlaybackStatus('playing');
        } catch (e) {
          console.warn('Native player replace error:', e);
        }
      }

      // On Web: HTML5 Audio
      if (Platform.OS === 'web') {
        try {
          if (webAudioRef.current) {
            webAudioRef.current.pause();
            webAudioRef.current.src = '';
            webAudioRef.current = null;
          }

          const audio = new window.Audio(playableUrl);
          audio.volume = 1.0;
          audio.muted = false;

          audio.ontimeupdate = () => {
            if (isMounted) {
              updatePlaybackPosition(audio.currentTime, audio.duration || currentTrack.duration);
            }
          };

          audio.onended = () => {
            if (isMounted) nextTrack();
          };

          audio.oncanplay = () => {
            if (isMounted && usePlayerStore.getState().playbackStatus === 'buffering') {
              setPlaybackStatus('playing');
            }
          };

          webAudioRef.current = audio;

          audio.play().then(() => {
            if (isMounted) setPlaybackStatus('playing');
          }).catch((err) => {
            console.warn('Web autoplay blocked until user gesture, click Play to listen:', err.message);
            if (isMounted) setPlaybackStatus('paused');
          });
        } catch (err) {
          console.warn('Web HTML5 Audio failed:', err);
        }
      }
    }

    handleTrackChange();

    return () => {
      isMounted = false;
    };
  }, [currentTrack?.id]);

  // 6. Web Media Session API for notification and OS tile controls
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      if (currentTrack) {
        navigator.mediaSession.metadata = new (window as any).MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album || 'Musify',
          artwork: [
            {
              src: currentTrack.artworkUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
              sizes: '512x512',
              type: 'image/jpeg',
            },
          ],
        });
      }

      try {
        navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
        navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => previousTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
        navigator.mediaSession.setActionHandler('seekto', (details: any) => {
          if (details && typeof details.seekTime === 'number') {
            seekTo(details.seekTime);
            if (webAudioRef.current) webAudioRef.current.currentTime = details.seekTime;
            if (player) player.seekTo(details.seekTime);
          }
        });
      } catch (e) {
        console.warn('MediaSession setActionHandler error:', e);
      }
    }
  }, [currentTrack]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
