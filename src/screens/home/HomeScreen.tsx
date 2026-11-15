import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Bell,
  User,
  Play,
  Pause,
  Flame,
  Sparkles,
  Disc3,
  Radio,
  Compass,
  Bot,
} from "lucide-react-native";
import { BlurView } from "expo-blur";
import { AppShell } from "../../components/layout/AppShell";
import { useThemeStore } from "../../store/useThemeStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { musicApiService } from "../../services/api/musicApiService";
import {
  AI_SUGGESTED_PROMPTS,
  aiMusicService,
} from "../../services/ai/aiMusicService";
import {
  cloudService,
  UserProfile,
} from "../../services/supabase/cloudService";
import { GlassPressable } from "../../components/common/GlassPressable";
import { Track, Playlist, Artist } from "../../types/models";
import { RootStackParamList } from "../../navigation/types";
import { hapticFeedback } from "../../utils/haptics";
import { LIQUID_GLASS } from "../../constants/liquidGlass";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEGORIES = [
  "All",
  "Trending",
  "New Releases",
  "Playlists",
  "Artists",
  "Radio",
];

export const HomeScreen: React.FC = () => {
  const { colors } = useThemeStore();
  const { playTrack, currentTrack, playbackStatus, togglePlayPause } =
    usePlayerStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    cloudService.getCurrentUser().then((user) => {
      if (isMounted) setCurrentUser(user);
    });

    async function loadData() {
      try {
        const [liveTracks, livePlaylists, liveArtists] = await Promise.all([
          musicApiService.getTrendingTracks(25),
          musicApiService.getTrendingPlaylists(),
          musicApiService.getFeaturedArtists(),
        ]);

        if (isMounted) {
          setTracks(liveTracks);
          setPlaylists(livePlaylists);
          setArtists(liveArtists);
        }
      } catch (err) {
        console.warn("Failed to load home data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredTrack = tracks[0];

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header with Brand & Floating Glass Action Circles */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.logoRow}>
              <Image
                source={require("../../../assets/musify_logo.png")}
                style={styles.headerBrandLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandTitle}>MUSIFY</Text>
            </View>
            <Text style={styles.greeting}>
              {currentUser?.name
                ? `Welcome back, ${currentUser.name}`
                : "Good Evening"}
            </Text>
          </View>

          <View style={styles.headerIcons}>
            <GlassPressable
              onPress={() => navigation.navigate("NotificationCenter")}
              style={styles.iconCircleGlass}
              scaleTo={0.9}
            >
              <BlurView
                intensity={70}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.glassButtonTint} />
              <Bell size={18} color="#FFFFFF" />
            </GlassPressable>

            <GlassPressable
              onPress={() => navigation.navigate("UserProfile")}
              style={styles.iconCircleGlass}
              scaleTo={0.9}
            >
              <BlurView
                intensity={70}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.glassButtonTint} />
              <User size={18} color="#FFFFFF" />
            </GlassPressable>
          </View>
        </View>

        {/* 2. Hero Featured Card with Liquid Glass Depth */}
        {featuredTrack && (
          <GlassPressable
            onPress={() => playTrack(featuredTrack, tracks)}
            style={styles.heroGlassCard}
            scaleTo={0.98}
          >
            <Image
              source={{ uri: featuredTrack.artworkUrl }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroGradientOverlay}>
              <View style={styles.heroBadge}>
                <BlurView
                  intensity={65}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.heroBadgeTint} />
                <Flame size={12} color={colors.primary} />
                <Text style={styles.heroBadgeText}>TOP 100 SONGS 2026</Text>
              </View>

              <Text numberOfLines={2} style={styles.heroTitle}>
                {featuredTrack.title}
              </Text>
              <Text numberOfLines={1} style={styles.heroSubtitle}>
                {featuredTrack.artist} • Billboard Hot 100
              </Text>

              {/* Floating Stream Now Glass Pill */}
              <View style={styles.heroPlayPill}>
                <BlurView
                  intensity={80}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.heroPlayTint} />
                <Play
                  size={14}
                  color="#FFFFFF"
                  fill="#FFFFFF"
                  style={{ marginLeft: 2 }}
                />
                <Text style={styles.heroPlayText}>Stream Now</Text>
              </View>
            </View>
          </GlassPressable>
        )}

        {/* 3. Filter Category Pills (SECONDARY GLASS) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                onPress={() => {
                  hapticFeedback.selection();
                  setSelectedCategory(cat);
                }}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillSelected,
                ]}
              >
                <BlurView
                  intensity={isSelected ? 60 : 75}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                <View
                  style={[
                    styles.secondaryGlassTint,
                    isSelected && styles.categorySelectedTint,
                  ]}
                />
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isSelected
                        ? "#FFFFFF"
                        : "rgba(255, 255, 255, 0.70)",
                      fontWeight: isSelected ? "700" : "600",
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 3.5 AI Mixes & Mood Generative Vibe Stream */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Sparkles size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>AI Mood Mixes</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                (navigation as any).navigate("MainTabs", { screen: "Search" })
              }
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                Explore AI
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {AI_SUGGESTED_PROMPTS.map((promptItem, pIdx) => {
              const isSelected = aiGenerating === promptItem.query;
              return (
                <TouchableOpacity
                  key={`ai-prompt-${pIdx}`}
                  activeOpacity={0.85}
                  onPress={async () => {
                    hapticFeedback.medium();
                    setAiGenerating(promptItem.query);
                    try {
                      const aiRes =
                        await aiMusicService.generatePlaylistFromPrompt(
                          promptItem.query,
                        );
                      if (aiRes.tracks.length > 0) {
                        playTrack(aiRes.tracks[0], aiRes.tracks);
                      }
                    } finally {
                      setAiGenerating(null);
                    }
                  }}
                  style={styles.aiMoodCard}
                >
                  <BlurView
                    intensity={75}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.aiCardGlassWash} />
                  <View style={styles.aiCardTopRow}>
                    <Sparkles size={18} color={colors.primary} />
                    {isSelected ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <View style={styles.aiPlayMiniPill}>
                        <Play
                          size={10}
                          color={colors.primary}
                          fill={colors.primary}
                        />
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={1} style={styles.aiMoodTitle}>
                    {promptItem.label}
                  </Text>
                  <Text numberOfLines={2} style={styles.aiMoodSubtitle}>
                    {promptItem.mood} • {promptItem.query}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {loading && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* 4. Recently Played Glass Cards */}
        {playlists.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recently Played</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsRow}
            >
              {playlists.slice(0, 6).map((playlist, idx) => (
                <TouchableOpacity
                  key={`${playlist.id}-${idx}`}
                  activeOpacity={0.88}
                  onPress={() =>
                    navigation.navigate("PlaylistDetails", {
                      playlistId: playlist.id,
                    })
                  }
                  style={styles.playlistCard}
                >
                  <View style={styles.playlistCoverWrap}>
                    <Image
                      source={{ uri: playlist.coverUrl }}
                      style={styles.playlistCover}
                    />
                  </View>
                  <Text numberOfLines={1} style={styles.playlistTitle}>
                    {playlist.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.playlistSubtitle}>
                    Playlist
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 5. Trending Tracks with Liquid Secondary Glass Cards */}
        {tracks.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                Trending & Recommendations
              </Text>
            </View>

            {tracks.slice(1, 15).map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isPlaying = isCurrent && playbackStatus === "playing";

              return (
                <View key={`${track.id}-${idx}`}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => playTrack(track, tracks)}
                    style={styles.releaseRow}
                  >
                    <Image
                      source={{ uri: track.artworkUrl }}
                      style={styles.trackArtwork}
                    />

                    <View style={styles.trackMetaWrap}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.trackTitle,
                          isCurrent && { color: colors.primary },
                        ]}
                      >
                        {track.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.trackArtist}>
                        {track.artist}
                      </Text>
                    </View>

                    {/* Duration & Playing Button */}
                    <View style={styles.rowRightActions}>
                      <Text style={styles.durationText}>
                        {track.duration
                          ? `${Math.floor(track.duration / 60)}:${String(Math.floor(track.duration % 60)).padStart(2, "0")}`
                          : "03:15"}
                      </Text>
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => {
                          if (isCurrent) {
                            togglePlayPause();
                          } else {
                            playTrack(track, tracks);
                          }
                        }}
                        style={styles.circlePlayPause}
                      >
                        {isPlaying ? (
                          <Pause size={14} color="#FFFFFF" fill="#FFFFFF" />
                        ) : (
                          <Play
                            size={14}
                            color="#FFFFFF"
                            fill="#FFFFFF"
                            style={{ marginLeft: 2 }}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Subtle Translucent Liquid Divider Line */}
                  <View style={styles.rowDivider} />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: LIQUID_GLASS.layout.scrollBottomPadding,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },

  headerBrandLogo: {
    width: 46,
    height: 46,
  },

  brandTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: LIQUID_GLASS.text.primary,
  },

  greeting: {
    fontSize: 13,
    fontWeight: "500",
    color: LIQUID_GLASS.text.tertiary,
  },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconCircleGlass: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: LIQUID_GLASS.material.dock.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  glassButtonTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  // HERO BANNER

  heroGlassCard: {
    height: 215,
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
    marginVertical: 12,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: LIQUID_GLASS.shadow.floating.shadowColor,
    shadowOffset: LIQUID_GLASS.shadow.floating.shadowOffset,
    shadowOpacity: LIQUID_GLASS.shadow.floating.shadowOpacity,
    shadowRadius: LIQUID_GLASS.shadow.floating.shadowRadius,
    elevation: LIQUID_GLASS.shadow.floating.elevation,
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  heroGradientOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(4, 6, 10, 0.68)",
    padding: 18,
    justifyContent: "flex-end",
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.22)",
    overflow: "hidden",
    backgroundColor: "transparent",
    marginBottom: 8,
  },

  heroBadgeTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },

  heroTitle: {
    color: "#F0F1F4",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 26,
    marginBottom: 4,
  },

  heroSubtitle: {
    color: "#969BA5",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 12,
  },

  heroPlayPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },

  heroPlayTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },

  heroPlayText: {
    color: "#F0F1F4",
    fontSize: 12,
    fontWeight: "700",
  },

  // CATEGORY PILLS

  categoryScroll: {
    gap: 8,
    paddingVertical: 10,
  },

  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.28)",
    overflow: "hidden",
    backgroundColor: "transparent",
  },

  categoryPillSelected: {
    borderColor: "rgba(255, 255, 255, 0.65)",
  },

  secondaryGlassTint: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  categorySelectedTint: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },

  categoryText: {
    fontSize: 13,
  },

  // SECTION HEADERS

  sectionWrap: {
    marginBottom: 26,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: LIQUID_GLASS.text.primary,
  },

  seeAllText: {
    fontSize: 13,
    fontWeight: "700",
  },

  cardsRow: {
    gap: 14,
  },

  // PLAYLIST CARDS

  playlistCard: {
    width: 136,
  },

  playlistCoverWrap: {
    width: 136,
    height: 136,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1.2,
    borderColor: LIQUID_GLASS.material.secondary.border,
    shadowColor: LIQUID_GLASS.shadow.card.shadowColor,
    shadowOffset: LIQUID_GLASS.shadow.card.shadowOffset,
    shadowOpacity: LIQUID_GLASS.shadow.card.shadowOpacity,
    shadowRadius: LIQUID_GLASS.shadow.card.shadowRadius,
    elevation: LIQUID_GLASS.shadow.card.elevation,
  },

  playlistCover: {
    width: "100%",
    height: "100%",
  },

  playlistTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: LIQUID_GLASS.text.primary,
    marginBottom: 2,
  },

  playlistSubtitle: {
    fontSize: 12,
    color: LIQUID_GLASS.text.tertiary,
  },

  // RECENTLY PLAYED / TRACK ROWS

  releaseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.045)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.085)",
    overflow: "hidden",
  },

  trackArtwork: {
    width: 54,
    height: 54,
    borderRadius: 15,
    marginRight: 13,
    backgroundColor: "#252A32",
  },

  trackMetaWrap: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },

  trackTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F0F1F4",
    letterSpacing: -0.2,
    marginBottom: 5,
  },

  trackArtist: {
    fontSize: 11,
    color: "#969DA9",
    fontWeight: "500",
  },

  rowRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 8,
  },

  durationText: {
    fontSize: 11,
    color: "#858C98",
    fontWeight: "600",
  },

  circlePlayPause: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.075)",
  },

  rowDivider: {
    height: 0,
    backgroundColor: "transparent",
    marginLeft: 0,
    marginRight: 0,
    marginVertical: 0,
  },

  // AI MOOD MIXES — PREMIUM GLASS CARDS

  aiMoodCard: {
    width: 168,
    height: 142,
    borderRadius: 24,
    padding: 15,
    overflow: "hidden",
    justifyContent: "space-between",
    backgroundColor: "rgba(24, 28, 35, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.13)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },

  aiCardGlassWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.035)",
  },

  aiCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  aiMoodEmoji: {
    fontSize: 25,
  },

  aiPlayMiniPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(185, 198, 216, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(185, 198, 216, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  aiMoodTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F0F1F4",
    letterSpacing: -0.3,
    marginTop: 8,
    marginBottom: 5,
  },

  aiMoodSubtitle: {
    fontSize: 11,
    color: "#A0A6B1",
    lineHeight: 16,
    fontWeight: "500",
  },
});
