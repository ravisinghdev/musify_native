import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { MiniPlayer } from '../player/MiniPlayer';
import { usePlayerStore } from '../../store/usePlayerStore';
import { LIQUID_GLASS } from '../../constants/liquidGlass';

interface AppShellProps {
  children: React.ReactNode;
  showMiniPlayer?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, showMiniPlayer = true }) => {
  const { currentTrack, playbackStatus } = usePlayerStore();
  const isPlaying = playbackStatus === 'playing';

  // Dynamic Floating Aurora Orb Animations
  const orbScale1 = useSharedValue(1);
  const orbTranslateX1 = useSharedValue(0);
  const orbTranslateY1 = useSharedValue(0);

  const orbScale2 = useSharedValue(1);
  const orbTranslateX2 = useSharedValue(0);
  const orbTranslateY2 = useSharedValue(0);

  useEffect(() => {
    // Orb 1 subtle breathing orbit
    orbScale1.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.92, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orbTranslateX1.value = withRepeat(
      withSequence(
        withTiming(40, { duration: 7500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-40, { duration: 7500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orbTranslateY1.value = withRepeat(
      withSequence(
        withTiming(-35, { duration: 6800, easing: Easing.inOut(Easing.ease) }),
        withTiming(35, { duration: 6800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Orb 2 counter-motion orbit
    orbScale2.value = withRepeat(
      withSequence(
        withTiming(0.88, { duration: 5200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.14, { duration: 5200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orbTranslateX2.value = withRepeat(
      withSequence(
        withTiming(-50, { duration: 8200, easing: Easing.inOut(Easing.ease) }),
        withTiming(50, { duration: 8200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    orbTranslateY2.value = withRepeat(
      withSequence(
        withTiming(45, { duration: 7200, easing: Easing.inOut(Easing.ease) }),
        withTiming(-45, { duration: 7200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedOrb1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: orbTranslateX1.value },
      { translateY: orbTranslateY1.value },
      { scale: orbScale1.value },
    ],
  }));

  const animatedOrb2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: orbTranslateX2.value },
      { translateY: orbTranslateY2.value },
      { scale: orbScale2.value },
    ],
  }));

  return (
    <View style={styles.container}>
      {/* 1. Dynamic Canvas: Poster Artwork-Reactive Color Refraction */}
      {currentTrack?.artworkUrl ? (
        <View style={StyleSheet.absoluteFill}>
          {/* Base Uncompressed Poster Layer with Heavy Gaussian Blur */}
          <Image
            source={{ uri: currentTrack.artworkUrl }}
            style={styles.ambientImage}
            blurRadius={Platform.OS === 'ios' ? 40 : 25}
          />
          {/* ColorOS / Apple Music Atmospheric Refraction Tint */}
          <BlurView intensity={Platform.OS === 'ios' ? 65 : 45} tint="dark" style={StyleSheet.absoluteFill} />
          {/* Subtle OLED Dark Absorption Veil letting poster colors softly bleed through */}
          <View style={styles.liquidVeil} />
        </View>
      ) : (
        /* Dynamic Floating Minimalist Orbs */
        <View style={styles.auroraContainer}>
          <Animated.View style={[styles.auroraTopBeam, animatedOrb1]} />
          <Animated.View style={[styles.auroraMidFluid, animatedOrb2]} />
          <View style={styles.auroraBottomGlow} />
        </View>
      )}

      {/* 2. SafeArea & Screen Viewport */}
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeContent}>
        <StatusBar style="light" />
        <View style={styles.innerContent}>{children}</View>
      </SafeAreaView>

      {/* 3. Floating MiniPlayer */}
      {showMiniPlayer && (
        <View style={styles.miniPlayerWrap} pointerEvents="box-none">
          <MiniPlayer />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  ambientImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.72, // Rich poster color radiance
    transform: [{ scale: 1.15 }], // Eliminates edge vignetting during Gaussian blur
  },
  liquidVeil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.62)', // Soft, calming absorption for high readability
  },
  auroraContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  auroraTopBeam: {
    position: 'absolute',
    top: -140,
    right: -80,
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  auroraMidFluid: {
    position: 'absolute',
    top: '32%',
    left: -160,
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
  },
  auroraBottomGlow: {
    position: 'absolute',
    bottom: -140,
    right: -60,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    transform: [{ scaleX: 1.3 }],
  },
  safeContent: {
    flex: 1,
  },
  innerContent: {
    flex: 1,
  },
  miniPlayerWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 88 : 74,
    left: 0,
    right: 0,
    zIndex: 99,
    backgroundColor: 'transparent',
  },
});
