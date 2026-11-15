import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronDown,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Bookmark,
  Share2,
  Shuffle,
  Repeat,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ListMusic,
  Sliders,
  Moon,
} from "lucide-react-native";
import { VideoView } from "expo-video";
import { useVideoSyncStore } from "../../store/useVideoSyncStore";
import { SleepTimerModal } from "./SleepTimerModal";
import { AnimatedLyricRow } from "./AnimatedLyricRow";
import { useSleepTimerStore } from "../../store/useSleepTimerStore";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useThemeStore } from "../../store/useThemeStore";
import { hapticFeedback } from "../../utils/haptics";
import { lyricsService, LyricLine } from "../../services/lyrics/lyricsService";
import { cloudService } from "../../services/supabase/cloudService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SEGMENT_ITEM_WIDTH = 76;
const SEGMENT_PILL_HEIGHT = 36;

export const FullPlayerModal: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const [mediaMode, setMediaMode] = useState<"song" | "video">("song");
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSleepModalVisible, setIsSleepModalVisible] = useState(false);
  const isSleepActive = useSleepTimerStore((s) => s.isActive);
  const playerInstance = useVideoSyncStore((s) => s.playerInstance);
  const isQualitySwapping = useVideoSyncStore((s) => s.isQualitySwapping);
  const [lyricsLines, setLyricsLines] = useState<LyricLine[]>([]);
  const lyricsScrollRef = useRef<any>(null);

  // Drag-to-expand gesture for lyrics drawer:
  // 0 = small bottom box (collapsed)
  // 1 = full-screen / expanded immersive lyrics
  const lyricsProgress = useSharedValue(0);
  const startDragProgress = useSharedValue(0);

  const lyricsDragGesture = Gesture.Pan()
    .onStart(() => {
      startDragProgress.value = lyricsProgress.value;
      runOnJS(hapticFeedback.light)();
    })
    .onUpdate((event) => {
      // Fluid, natural tracking: drag sensitivity based on full screen height
      const delta = -event.translationY / (SCREEN_HEIGHT * 0.7);
      const target = Math.max(0, Math.min(1, startDragProgress.value + delta));
      lyricsProgress.value = target;
    })
    .onEnd((event) => {
      // Inertia-guided buttery spring release
      const isFlingUp = event.velocityY < -500;
      const isFlingDown = event.velocityY > 500;
      let finalTarget = 0;

      if (isFlingUp) {
        finalTarget = 1;
      } else if (isFlingDown) {
        finalTarget = 0;
      } else {
        // Natural threshold
        finalTarget = lyricsProgress.value > 0.35 ? 1 : 0;
      }

      // Buttery ColorOS 17 spring physics (optimal critically-damped spring)
      lyricsProgress.value = withSpring(finalTarget, {
        damping: 24,
        stiffness: 180,
        mass: 0.8,
        velocity: -event.velocityY / 1000,
      });

      runOnJS(hapticFeedback.medium)();
    });

  const animatedLyricsContainerStyle = useAnimatedStyle(() => {
    // Smooth transform expansion: height expands from 110px to full-screen
    const height = interpolate(
      lyricsProgress.value,
      [0, 1],
      [110, SCREEN_HEIGHT],
    );

    const borderRadius = interpolate(
      lyricsProgress.value,
      [0, 0.9, 1],
      [28, 14, 0],
    );

    // Subtle scale bounce for tactile liquid feeling
    const scale = interpolate(
      lyricsProgress.value,
      [0, 0.05, 0.95, 1],
      [1, 1.006, 1.002, 1],
    );

    return {
      height,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      borderBottomLeftRadius: borderRadius,
      borderBottomRightRadius: borderRadius,
      transform: [{ scale }],
    };
  });

  const animatedCollapsedContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(lyricsProgress.value, [0, 0.25], [1, 0]);
    const translateY = interpolate(lyricsProgress.value, [0, 0.25], [0, -10]);
    return {
      opacity,
      transform: [{ translateY }],
      display: lyricsProgress.value > 0.3 ? "none" : "flex",
    };
  });

  const animatedExpandedContentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(lyricsProgress.value, [0.25, 0.8], [0, 1]);
    const translateY = interpolate(lyricsProgress.value, [0.25, 1], [30, 0]);
    return {
      opacity,
      transform: [{ translateY }],
      display: lyricsProgress.value < 0.15 ? "none" : "flex",
    };
  });

  // Gesture-driven fluid sliding pill for Song / Video selector
  const modeIndex = mediaMode === "song" ? 0 : 1;
  const slideX = useSharedValue(modeIndex * SEGMENT_ITEM_WIDTH);
  const pillScaleX = useSharedValue(1);
  const pillScaleY = useSharedValue(1);
  const isPillDragging = useSharedValue(false);

  const changeMode = (targetIndex: number) => {
    hapticFeedback.selection();
    const newMode = targetIndex === 0 ? "song" : "video";
    setMediaMode(newMode);
    useVideoSyncStore.getState().setVideoTabActive(newMode === "video");
    slideX.value = withSpring(targetIndex * SEGMENT_ITEM_WIDTH, {
      damping: 18,
      stiffness: 240,
      mass: 0.5,
    });
  };

  const segmentPanGesture = Gesture.Pan()
    .onStart(() => {
      isPillDragging.value = true;
      runOnJS(hapticFeedback.light)();
    })
    .onUpdate((event) => {
      const minX = -10;
      const maxX = SEGMENT_ITEM_WIDTH + 10;
      const targetX = modeIndex * SEGMENT_ITEM_WIDTH + event.translationX;
      slideX.value = Math.max(minX, Math.min(maxX, targetX));

      // ColorOS 17 Pop-out elasticity on drag
      const absSpeed = Math.min(Math.abs(event.velocityX), 1200);
      pillScaleX.value = withSpring(1.22 + (absSpeed / 1200) * 0.18, {
        damping: 14,
        stiffness: 300,
      });
      pillScaleY.value = withSpring(1.36, { damping: 14, stiffness: 300 });
    })
    .onEnd((event) => {
      isPillDragging.value = false;
      const predictedX = slideX.value + event.velocityX * 0.1;
      const targetIndex = predictedX > SEGMENT_ITEM_WIDTH / 2 ? 1 : 0;

      slideX.value = withSpring(targetIndex * SEGMENT_ITEM_WIDTH, {
        velocity: event.velocityX,
        damping: 18,
        stiffness: 240,
        mass: 0.5,
      });
      pillScaleX.value = withSpring(1, { damping: 16, stiffness: 240 });
      pillScaleY.value = withSpring(1, { damping: 16, stiffness: 240 });

      runOnJS(changeMode)(targetIndex);
    });

  const animatedSegmentPillStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: slideX.value },
        { scaleX: pillScaleX.value },
        { scaleY: pillScaleY.value },
      ],
      zIndex: isPillDragging.value ? 50 : 2,
    };
  });

  const {
    currentTrack,
    playbackStatus,
    togglePlayPause,
    nextTrack,
    previousTrack,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    position,
    duration,
    seekTo,
  } = usePlayerStore();

  // Fetch synchronized lyrics on track change
  useEffect(() => {
    if (!currentTrack) return;
    let isCurrent = true;

    lyricsService
      .fetchLyrics(
        currentTrack.title,
        currentTrack.artist,
        currentTrack.duration,
      )
      .then((res) => {
        if (isCurrent && res) {
          setLyricsLines(res.lines);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [currentTrack?.id, currentTrack?.title, currentTrack?.artist]);

  // Current active synced line index based on playback position (in seconds)
  const currentPosMs = (position || 0) * 1000;
  const activeLineIndex = lyricsLines.reduce((acc, line, idx) => {
    return line.timeMs <= currentPosMs ? idx : acc;
  }, 0);

  // Auto-scroll lyrics when line updates in expanded view
  useEffect(() => {
    if (lyricsLines.length > 0 && lyricsScrollRef.current) {
      lyricsScrollRef.current.scrollTo({
        y: Math.max(0, activeLineIndex * 46 - 80),
        animated: true,
      });
    }
  }, [activeLineIndex]);

  if (!currentTrack) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: "#0A0A0F" }]}>
        <Text style={{ color: colors.textSecondary }}>No media playing</Text>
      </View>
    );
  }

  const isPlaying = playbackStatus === "playing";
  const progressRatio = duration > 0 ? Math.min(position / duration, 1) : 0;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs <= 0) return "0:00";
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  const handleProgressBarPress = (evt: any) => {
    if (duration <= 0) return;
    hapticFeedback.selection();
    const { locationX } = evt.nativeEvent;
    const barWidth = SCREEN_WIDTH - 40;
    const clickRatio = Math.max(0, Math.min(locationX / barWidth, 1));
    const targetSecond = Math.floor(clickRatio * duration);
    seekTo(targetSecond);
  };

  return (
    <View style={styles.rootContainer}>
      {/* 1. Full Screen Immersive Album Background with Heavy Cinematic Blur */}
      <Image
        source={{ uri: currentTrack.artworkUrl }}
        style={styles.backgroundImage}
        blurRadius={Platform.OS === "ios" ? 55 : 45}
      />
      {/* Liquid Glass Ambient Frosted Overlay for Deep Diffusion */}
      <BlurView
        intensity={Platform.OS === "ios" ? 70 : 85}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      {/* Deep cinematic vignette overlay */}
      <View style={styles.darkGradientOverlay} />

      <SafeAreaView edges={["top", "bottom"]} style={styles.safeContainer}>
        {/* 2. Top Header with Back, Song/Video Pill Segment, & More Options */}
        <View style={styles.topHeaderRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerGlassButton}
            activeOpacity={0.8}
          >
            <BlurView
              intensity={70}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <ChevronDown size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Song / Video Floating Segmented Capsule with Fluid Slider (Pure Translucent - No Square Background) */}
          <View style={styles.segmentCapsule} pointerEvents="box-none">
            {/* Gesture-driven pop-out slider pill */}
            <GestureDetector gesture={segmentPanGesture}>
              <Animated.View
                style={[
                  styles.slidingActiveSegmentPill,
                  animatedSegmentPillStyle,
                ]}
              >
                <BlurView
                  intensity={70}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.slidingActiveGlow} />
              </Animated.View>
            </GestureDetector>

            <TouchableOpacity
              onPress={() => changeMode(0)}
              style={styles.segmentItem}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.segmentText,
                  mediaMode === "song"
                    ? styles.segmentTextActive
                    : styles.segmentTextInactive,
                ]}
              >
                Song
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => changeMode(1)}
              style={styles.segmentItem}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.segmentText,
                  mediaMode === "video"
                    ? styles.segmentTextActive
                    : styles.segmentTextInactive,
                ]}
              >
                Video
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sleep Timer & EQ Quick Controls */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              style={[
                styles.headerGlassButton,
                isSleepActive && {
                  borderColor: colors.primary,
                  backgroundColor: "rgba(255,255,255,0.12)",
                },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                hapticFeedback.light();
                setIsSleepModalVisible(true);
              }}
            >
              <BlurView
                intensity={70}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.glassPlateWash} />
              <Moon
                size={18}
                color={isSleepActive ? colors.primary : "#FFFFFF"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerGlassButton}
              activeOpacity={0.8}
              onPress={() => {
                hapticFeedback.light();
                (navigation as any).navigate("EqualizerModal");
              }}
            >
              <BlurView
                intensity={70}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.glassPlateWash} />
              <Sliders size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Immersive Center Artwork Hero Card or High-Definition Video Player with Liquid Glass Framing */}
        <View style={styles.heroArtworkSection}>
          <View style={styles.heroArtworkWrap}>
            {mediaMode === "video" && playerInstance ? (
              <View style={StyleSheet.absoluteFill}>
                <VideoView
                  player={playerInstance}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  nativeControls={false}
                />
                {isQualitySwapping && (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: "rgba(0,0,0,0.6)",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 11,
                        marginTop: 6,
                        letterSpacing: 0.5,
                      }}
                    >
                      SWITCHING TO HD
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Image
                source={{ uri: currentTrack.artworkUrl }}
                style={styles.heroArtworkImage}
                resizeMode="cover"
              />
            )}
            {/* Subtle top edge specular reflection */}
            <View style={styles.heroArtworkReflection} />
          </View>
        </View>

        {/* 4. Track Details & Circular Heart Button */}
        <View style={styles.trackDetailsRow}>
          <View style={styles.trackInfoTextWrap}>
            <Text style={styles.playingFromLabel}>Playing From</Text>
            <Text numberOfLines={1} style={styles.trackMainTitle}>
              {currentTrack.title}
            </Text>
            <Text numberOfLines={1} style={styles.trackArtistName}>
              {currentTrack.artist}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={async () => {
              hapticFeedback.medium();
              const nextLiked = !isLiked;
              setIsLiked(nextLiked);
              if (currentTrack) {
                await cloudService.toggleLikeTrack(currentTrack);
              }
            }}
            style={styles.heartGlassBtn}
          >
            <BlurView
              intensity={70}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassPlateWash} />
            <Heart
              size={20}
              color={isLiked ? colors.primary : "#FFFFFF"}
              fill={isLiked ? colors.primary : "transparent"}
            />
          </TouchableOpacity>
        </View>

        {/* 5. Social Action Strip (Pure Translucent Glass) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.socialStrip}
        >
          {/* Like Pill with Count */}
          <TouchableOpacity style={styles.socialGlassPill} activeOpacity={0.85}>
            <BlurView
              intensity={70}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassPlateWash} />
            <ThumbsUp size={15} color={colors.primary} fill={colors.primary} />
            <Text style={styles.socialPillText}>1.7M</Text>
            <View style={styles.socialDivider} />
            <ThumbsDown size={15} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {/* Comments Pill */}
          <TouchableOpacity style={styles.socialGlassPill} activeOpacity={0.85}>
            <BlurView
              intensity={70}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassPlateWash} />
            <MessageCircle size={15} color="#FFFFFF" />
            <Text style={styles.socialPillText}>1.2K</Text>
          </TouchableOpacity>

          {/* Save Pill */}
          <TouchableOpacity
            style={styles.socialGlassPill}
            activeOpacity={0.85}
            onPress={() => {
              hapticFeedback.light();
              setIsSaved(!isSaved);
            }}
          >
            <BlurView
              intensity={70}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassPlateWash} />
            <Bookmark
              size={15}
              color={isSaved ? colors.primary : "#FFFFFF"}
              fill={isSaved ? colors.primary : "transparent"}
            />
            <Text style={styles.socialPillText}>Save</Text>
          </TouchableOpacity>

          {/* Share Pill */}
          <TouchableOpacity style={styles.socialGlassPill} activeOpacity={0.85}>
            <BlurView
              intensity={70}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassPlateWash} />
            <Share2 size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </ScrollView>

        {/* 6. Glowing Liquid Glass Progress Bar with Sliding Thumb */}
        <View style={styles.scrubberSection}>
          <View style={styles.timeLabelsRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>
              {duration > 0 ? formatTime(duration) : "03:20"}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.95}
            onPress={handleProgressBarPress}
            style={styles.scrubberTrack}
          >
            {/* Background inactive groove */}
            <View style={styles.scrubberGroove} />

            {/* Filled Liquid Glass Portion */}
            <View
              style={[
                styles.scrubberFilledPortion,
                {
                  width: `${progressRatio * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            >
              {/* Glowing Indicator Thumb Circle */}
              <View
                style={[
                  styles.scrubberThumbCircle,
                  {
                    shadowColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* 7. Player Controls Bar */}
        <View style={styles.playerControlsRow}>
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              toggleShuffle();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Shuffle
              size={20}
              color={isShuffle ? colors.primary : "rgba(255,255,255,0.65)"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              previousTrack();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <SkipBack size={28} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>

          {/* Translucent Liquid Glass Play/Pause Hero Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              hapticFeedback.medium();
              togglePlayPause();
            }}
            style={styles.heroPlayCircle}
          >
            <BlurView
              intensity={85}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroPlayGlassTint} />
            {playbackStatus === "buffering" ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : isPlaying ? (
              <Pause size={28} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play
                size={28}
                color="#FFFFFF"
                fill="#FFFFFF"
                style={{ marginLeft: 3 }}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              nextTrack();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <SkipForward size={28} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              toggleRepeat();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Repeat
              size={20}
              color={
                repeatMode !== "off" ? colors.primary : "rgba(255,255,255,0.65)"
              }
            />
          </TouchableOpacity>
        </View>

        {/* Placeholder space for the floating bottom lyrics box so it doesn't overlap controls */}
        <View style={{ height: 116 }} />
      </SafeAreaView>

      {/* 8. Gesture-Draggable Synchronized Lyrics Floating Drawer (Anchored to Root Container) */}
      <Animated.View
        style={[styles.bottomLyricsCard, animatedLyricsContainerStyle]}
      >
        {/* Deep Ultra-Frosted Translucent Liquid Glass Plate */}
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.lyricsGlassWash} />

        {/* Dedicated Pan Gesture Handle Area */}
        <GestureDetector gesture={lyricsDragGesture}>
          <View style={styles.lyricsDragHandleArea}>
            <View style={styles.lyricsDrawerHandle} />

            <View style={styles.lyricsTitleRow}>
              <Text style={styles.lyricsHeaderLabel}>Synchronized Lyrics</Text>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.primary,
                  fontWeight: "800",
                  letterSpacing: 0.2,
                }}
              >
                Drag handle to expand / close
              </Text>
            </View>

            {/* Default State: Small Bottom Box showing smooth line-by-line transitions */}
            <Animated.View style={animatedCollapsedContentStyle}>
              <Text
                numberOfLines={1}
                style={[
                  styles.lyricsActiveLine,
                  {
                    color: colors.primary,
                    textShadowColor: colors.primary,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 10,
                  },
                ]}
              >
                {lyricsLines[activeLineIndex]?.text || "♪ Music is playing ♪"}
              </Text>
              <Text numberOfLines={1} style={styles.lyricsNextLine}>
                {lyricsLines[activeLineIndex + 1]?.text || "..."}
              </Text>
            </Animated.View>
          </View>
        </GestureDetector>

        {/* Dragged Above: Full Screen scrollable lyrics list */}
        <Animated.View
          style={[{ flex: 1, marginTop: 4 }, animatedExpandedContentStyle]}
        >
          <ScrollView
            ref={lyricsScrollRef}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={{ paddingVertical: 24, paddingBottom: 140 }}
          >
            {lyricsLines.map((line, idx) => {
              const isCurrentLine = idx === activeLineIndex;
              return (
                <AnimatedLyricRow
                  key={`${line.timeMs}-${idx}`}
                  lineText={line.text}
                  isCurrentLine={isCurrentLine}
                  activeColor={colors.primary}
                  onPress={() => {
                    hapticFeedback.selection();
                    seekTo(Math.floor(line.timeMs / 1000));
                  }}
                />
              );
            })}
          </ScrollView>
        </Animated.View>
      </Animated.View>

      {/* 9. Sleep Timer Floating Glass Modal */}
      <SleepTimerModal
        visible={isSleepModalVisible}
        onClose={() => setIsSleepModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // ==========================================
  // ROOT & BACKGROUND
  // ==========================================

  rootContainer: {
    flex: 1,
    backgroundColor: "#101216",
    position: "relative",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    opacity: 0.32,
  },

  darkGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(12,14,19,0.76)",
  },

  safeContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },

  // ==========================================
  // TOP HEADER
  // ==========================================

  topHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 10,
  },

  headerGlassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  // ==========================================
  // SLIDING SEGMENT CONTROL
  // ==========================================

  segmentCapsule: {
    flexDirection: "row",
    width: SEGMENT_ITEM_WIDTH * 2 + 6,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "visible",
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.035)",
    position: "relative",
  },

  slidingActiveSegmentPill: {
    position: "absolute",
    left: 3,
    top: 2,
    width: SEGMENT_ITEM_WIDTH,
    height: SEGMENT_PILL_HEIGHT,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.23)",
    overflow: "hidden",
    backgroundColor: "rgba(220,225,235,0.12)",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 5,
  },

  slidingActiveGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(220,225,235,0.055)",
    opacity: 1,
  },

  segmentItem: {
    width: SEGMENT_ITEM_WIDTH,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  segmentText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  segmentTextActive: {
    color: "#F0F1F4",
  },

  segmentTextInactive: {
    color: "rgba(220,225,235,0.48)",
  },

  glassPlateWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  // ==========================================
  // HERO ARTWORK
  // ==========================================

  heroArtworkSection: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },

  heroArtworkWrap: {
    width: SCREEN_WIDTH * 0.78,
    height: SCREEN_WIDTH * 0.78,
    borderRadius: 36,
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 18,
    },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 16,

    position: "relative",
  },

  heroArtworkImage: {
    width: "100%",
    height: "100%",
  },

  heroArtworkReflection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.28)",
  },

  // ==========================================
  // TRACK DETAILS
  // ==========================================

  trackDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
  },

  trackInfoTextWrap: {
    flex: 1,
    marginRight: 16,
  },

  playingFromLabel: {
    fontSize: 11,
    color: "rgba(220,225,235,0.46)",
    fontWeight: "600",
    marginBottom: 5,
    letterSpacing: 0.4,
  },

  trackMainTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F0F1F4",
    letterSpacing: -0.5,
    marginBottom: 3,
  },

  trackArtistName: {
    fontSize: 14,
    color: "rgba(220,225,235,0.62)",
    fontWeight: "500",
  },

  heartGlassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  // ==========================================
  // SOCIAL ACTIONS
  // ==========================================

  socialStrip: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  socialGlassPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.035)",
    gap: 6,
  },

  socialPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D9DDE5",
  },

  socialDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    marginHorizontal: 2,
  },

  // ==========================================
  // PROGRESS / SCRUBBER
  // ==========================================

  scrubberSection: {
    marginBottom: 16,
  },

  timeLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  timeText: {
    fontSize: 11,
    color: "rgba(220,225,235,0.48)",
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },

  scrubberTrack: {
    height: 18,
    justifyContent: "center",
    position: "relative",
  },

  scrubberGroove: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: "rgba(255,255,255,0.13)",
  },

  scrubberFilledPortion: {
    height: 4.5,
    borderRadius: 2.25,
    position: "relative",
    backgroundColor: "#B8C0CC",
  },

  scrubberThumbCircle: {
    position: "absolute",
    right: -7,
    top: -5,
    width: 15,
    height: 15,
    borderRadius: 7.5,

    borderWidth: 2,
    borderColor: "#E8EAF0",
    backgroundColor: "#D9DDE5",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.24,
    shadowRadius: 4,
    elevation: 4,
  },

  // ==========================================
  // PLAYER CONTROLS
  // ==========================================

  playerControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 10,
  },

  heroPlayCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    overflow: "hidden",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(220,225,235,0.09)",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },

  heroPlayGlassTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  // ==========================================
  // BOTTOM LYRICS DRAWER
  // ==========================================

  bottomLyricsCard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderBottomWidth: 0,

    overflow: "hidden",
    padding: 16,
    paddingTop: 14,

    backgroundColor: "rgba(22,25,31,0.92)",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.24,
    shadowRadius: 22,

    zIndex: 999,
  },

  lyricsGlassWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  lyricsTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 2,
  },

  lyricsDragHandleArea: {
    paddingBottom: 4,
  },

  lyricsDrawerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(220,225,235,0.30)",
    alignSelf: "center",
    marginBottom: 10,
  },

  lyricsHeaderLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E8EAF0",
    marginBottom: 4,
  },

  lyricsActiveLine: {
    fontSize: 13,
    fontWeight: "700",
    color: "#C4CBD5",
    marginBottom: 3,
  },

  lyricsNextLine: {
    fontSize: 12,
    color: "rgba(220,225,235,0.44)",
  },

  bottomLyricsCardExpanded: {
    maxHeight: 280,
  },

  lyricsLineText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  lyricsLineActive: {
    color: "#E8EAF0",
    fontWeight: "800",
    fontSize: 17,
  },

  lyricsLineInactive: {
    color: "rgba(220,225,235,0.40)",
    fontWeight: "500",
  },
});
