import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react-native";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useThemeStore } from "../../store/useThemeStore";
import { RootStackParamList } from "../../navigation/types";
import { hapticFeedback } from "../../utils/haptics";

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    playbackStatus,
    togglePlayPause,
    nextTrack,
    previousTrack,
    position,
    duration,
  } = usePlayerStore();
  const { colors } = useThemeStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!currentTrack) {
    return null;
  }

  const isPlaying = playbackStatus === "playing";
  const isBuffering = playbackStatus === "buffering";
  const progressRatio = duration > 0 ? Math.min(position / duration, 1) : 0;

  const formatElapsedTime = () => {
    if (!position || position <= 0) return "0:00";
    const mins = Math.floor(position / 60);
    const secs = Math.floor(position % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const formatRemainingTime = () => {
    if (!duration || duration <= 0) return "0:00";
    const remaining = Math.max(0, duration - position);
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    return `-${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleOpenFullPlayer = () => {
    hapticFeedback.light();
    if (currentTrack.type === "video") {
      navigation.navigate("VideoPlayerScreen", { trackId: currentTrack.id });
    } else {
      navigation.navigate("FullPlayerModal");
    }
  };

  return (
    <View style={styles.floatingWrapper}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handleOpenFullPlayer}
        style={styles.liquidCard}
      >
        {/* Pure Translucent Liquid Glass Plate (NO solid background) */}
        <BlurView
          intensity={Platform.OS === "ios" ? 70 : 85}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        {/* Translucent water reflection wash only */}
        <View style={styles.waterReflectionWash} />

        {/* 1. Track Info & Inline Controls Row */}
        <View style={styles.contentRow}>
          {/* Rounded Album Art */}
          <Image
            source={{ uri: currentTrack.artworkUrl }}
            style={styles.artwork}
            resizeMode="cover"
          />

          {/* Title & Artist */}
          <View style={styles.metaColumn}>
            <Text numberOfLines={1} style={styles.trackTitle}>
              {currentTrack.title}
            </Text>
            <Text numberOfLines={1} style={styles.trackArtist}>
              {currentTrack.artist}
            </Text>
          </View>

          {/* Inline Media Controls */}
          <View style={styles.controlsCluster}>
            <TouchableOpacity
              hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
              onPress={() => {
                hapticFeedback.light();
                previousTrack();
              }}
            >
              <SkipBack size={20} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
              onPress={() => {
                hapticFeedback.medium();
                togglePlayPause();
              }}
              style={styles.playPauseBtn}
            >
              {isBuffering ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : isPlaying ? (
                <Pause size={24} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Play
                  size={24}
                  color="#FFFFFF"
                  fill="#FFFFFF"
                  style={{ marginLeft: 2 }}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
              onPress={() => {
                hapticFeedback.light();
                nextTrack();
              }}
            >
              <SkipForward size={20} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>

            {/* Vertical Waveform Audio Equalizer bars with dynamic accent tint */}
            <View style={styles.equalizerWrap}>
              <View style={[styles.eqBar, { height: 6, backgroundColor: colors.primary }]} />
              <View style={[styles.eqBar, { height: 12, backgroundColor: colors.primary }]} />
              <View style={[styles.eqBar, { height: 18, backgroundColor: colors.primary }]} />
              <View style={[styles.eqBar, { height: 10, backgroundColor: colors.primary }]} />
              <View style={[styles.eqBar, { height: 6, backgroundColor: colors.primary }]} />
            </View>
          </View>
        </View>

        {/* 2. Scrubber Track with Dynamic Glow & Thumb */}
        <View style={styles.scrubberRow}>
          <Text style={styles.timeText}>{formatElapsedTime()}</Text>

          <View style={styles.progressGroove}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressRatio * 100}%`, backgroundColor: colors.primary },
              ]}
            >
              {progressRatio > 0 && (
                <View
                  style={[
                    styles.scrubberThumb,
                    {
                      backgroundColor: '#FFFFFF',
                      shadowColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                />
              )}
            </View>
          </View>

          <Text style={styles.timeText}>{formatRemainingTime()}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },

  liquidCard: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    position: "relative",

    // Deep translucent glass
    backgroundColor: "rgba(35, 38, 48, 0.48)",

    // Soft ambient depth
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
  },

  waterReflectionWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  artwork: {
    width: 46,
    height: 46,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 0.7,
    borderColor: "rgba(255,255,255,0.22)",
  },

  metaColumn: {
    flex: 1,
    justifyContent: "center",
    marginRight: 8,
  },

  trackTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.35,
    marginBottom: 4,
  },

  trackArtist: {
    fontSize: 12,
    color: "rgba(255,255,255,0.68)",
    fontWeight: "500",
    letterSpacing: 0.05,
  },

  controlsCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  playPauseBtn: {
    padding: 5,
  },

  equalizerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2.5,
    marginLeft: 4,
  },

  eqBar: {
    width: 3,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.85)",
  },

  scrubberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  timeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
    minWidth: 34,
    fontVariant: ["tabular-nums"],
  },

  progressGroove: {
    flex: 1,
    height: 3,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.20)",
    overflow: "visible",
    position: "relative",
    justifyContent: "center",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    position: "relative",
  },

  scrubberThumb: {
    position: "absolute",
    right: -5,
    top: -4.5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 5,
  },
});
