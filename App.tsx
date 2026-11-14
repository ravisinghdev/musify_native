import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { usePlayerStore } from './src/store/usePlayerStore';
import { setAudioModeAsync } from 'expo-audio';
import { NativeAudioController } from './src/components/player/NativeAudioController';

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

  // 1. Configure audio mode on app mount
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

  // 2. Web HTML5 Audio Player
  useEffect(() => {
    if (Platform.OS !== 'web' || !currentTrack?.mediaUrl) return;

    let isMounted = true;
    try {
      if (webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current.src = '';
        webAudioRef.current = null;
      }

      const audio = new window.Audio(currentTrack.mediaUrl);
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
      }).catch(() => {
        if (isMounted) setPlaybackStatus('paused');
      });
    } catch (e) {
      console.warn('Web Audio error:', e);
    }

    return () => {
      isMounted = false;
    };
  }, [currentTrack?.mediaUrl]);

  // Web play/pause control sync
  useEffect(() => {
    if (Platform.OS === 'web' && webAudioRef.current) {
      if (playbackStatus === 'playing') {
        webAudioRef.current.play().catch(() => {});
      } else if (playbackStatus === 'paused') {
        webAudioRef.current.pause();
      }
    }
  }, [playbackStatus]);

  // 3. Web Media Session API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new (window as any).MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Musify',
        artwork: [
          {
            src: currentTrack.artworkUrl,
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      try {
        navigator.mediaSession.setActionHandler('play', () => togglePlayPause());
        navigator.mediaSession.setActionHandler('pause', () => togglePlayPause());
        navigator.mediaSession.setActionHandler('previoustrack', () => previousTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
        navigator.mediaSession.setActionHandler('seekto', (details: any) => {
          if (details && typeof details.seekTime === 'number') {
            seekTo(details.seekTime);
            if (webAudioRef.current) webAudioRef.current.currentTime = details.seekTime;
          }
        });
      } catch (e) {}
    }
  }, [currentTrack]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
        {/* On native mobile: Mount a fresh player instance whenever mediaUrl changes.
            This gives a brand-new native ExoPlayer with 100% volume and zero state corruption! */}
        {Platform.OS !== 'web' && currentTrack?.mediaUrl ? (
          <NativeAudioController
            key={currentTrack.id || currentTrack.mediaUrl}
            mediaUrl={currentTrack.mediaUrl}
          />
        ) : null}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
