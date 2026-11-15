import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  TextInput,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import {
  ArrowLeft,
  User,
  ShieldCheck,
  Database,
  Heart,
  Headphones,
  Sliders,
  LogOut,
  Edit3,
  Check,
  ChevronRight,
  Sparkles,
  Play,
  Volume2,
} from "lucide-react-native";
import { AppShell } from "../../components/layout/AppShell";
import { GlassPressable } from "../../components/common/GlassPressable";
import {
  cloudService,
  UserProfile as SupabaseUserProfile,
} from "../../services/supabase/cloudService";
import { supabase } from "../../services/supabase/supabaseClient";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useThemeStore } from "../../store/useThemeStore";
import { hapticFeedback } from "../../utils/haptics";
import { Track } from "../../types/models";
import { LIQUID_GLASS } from "../../constants/liquidGlass";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { playTrack, currentTrack } = usePlayerStore();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SupabaseUserProfile | null>(null);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfileData() {
      try {
        const user = await cloudService.getCurrentUser();
        const likes = await cloudService.getLikedTracks();
        if (isMounted) {
          setProfile(user);
          setEditedName(user.name || "Musify Listener");
          setLikedTracks(likes);
        }
      } catch (e) {
        console.warn("Failed to load profile:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === profile?.name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    hapticFeedback.medium();
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: editedName.trim() },
      });

      if (!error && profile) {
        setProfile({ ...profile, name: editedName.trim() });
      }
    } catch (err) {
      console.warn("Failed to update name:", err);
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  };

  const handleSignOut = async () => {
    hapticFeedback.medium();
    await cloudService.signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: "AuthScreen" }],
    });
  };

  return (
    <AppShell showMiniPlayer={true}>
      {/* 1. Header Navigation Bar (Liquid Glass Dock Circle) */}
      <View style={styles.topHeader}>
        <GlassPressable
          onPress={() => navigation.goBack()}
          style={styles.iconCircleGlass}
          scaleTo={0.9}
        >
          <BlurView
            intensity={70}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glassButtonTint} />
          <ArrowLeft size={18} color="#FFFFFF" />
        </GlassPressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerBrandTitle}>MUSIFY</Text>
          <Text style={styles.headerSubtitle}>User Profile</Text>
        </View>

        <GlassPressable
          onPress={handleSignOut}
          style={[
            styles.iconCircleGlass,
            { borderColor: "rgba(255, 255, 255, 0.16)" },
          ]}
          scaleTo={0.9}
        >
          <BlurView
            intensity={70}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.glassButtonTint,
              { backgroundColor: "rgba(255, 255, 255, 0.06)" },
            ]}
          />
          <LogOut size={16} color="rgba(255, 255, 255, 0.75)" />
        </GlassPressable>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#00D2FF" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 2. Hero Profile Card with PRIMARY LIQUID GLASS */}
          <View style={styles.heroGlassCard}>
            <BlurView
              intensity={LIQUID_GLASS.material.primary.blur}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.primaryGlassTint} />
            <View style={styles.specularTopBorder} />

            {/* Glowing Refractive Avatar Disc */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatarGlassDisc}>
                <BlurView
                  intensity={65}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.avatarGlassTint} />
                <User size={38} color="#FFF" />
              </View>
              {/* Online indicator */}
              <View style={styles.activeDotBadge}>
                <View style={styles.activeDotCore} />
              </View>
            </View>

            {/* Name with inline editing */}
            <View style={styles.nameRow}>
              {isEditingName ? (
                <View style={styles.nameInputContainer}>
                  <TextInput
                    value={editedName}
                    onChangeText={setEditedName}
                    style={styles.nameInput}
                    autoFocus
                    selectTextOnFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                  />
                  <TouchableOpacity
                    onPress={handleSaveName}
                    disabled={isSavingName}
                    style={styles.saveNameBtn}
                  >
                    {isSavingName ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Check size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    hapticFeedback.light();
                    setIsEditingName(true);
                  }}
                  style={styles.nameDisplayBtn}
                >
                  <Text style={styles.profileNameText}>
                    {profile?.name || "Musify Listener"}
                  </Text>
                  <Edit3
                    size={15}
                    color="rgba(255, 255, 255, 0.45)"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.profileEmailText}>
              {profile?.email || "Cloud Member"}
            </Text>

            {/* Cloud Badges */}
            <View style={styles.badgesRow}>
              <View style={styles.cloudBadge}>
                <BlurView
                  intensity={60}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.secondaryGlassTint} />
                <Database size={12} color="#FFFFFF" />
                <Text style={styles.cloudBadgeText}>Supabase DB Active</Text>
              </View>

              <View style={styles.cloudBadge}>
                <BlurView
                  intensity={60}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.secondaryGlassTint} />
                <ShieldCheck size={12} color="#34D399" />
                <Text style={styles.cloudBadgeText}>Encrypted Session</Text>
              </View>
            </View>
          </View>

          {/* 3. Liquid Glass 3-Metric Stats Row (SECONDARY GLASS) */}
          <View style={styles.statsGrid}>
            <View style={styles.statGlassCard}>
              <BlurView
                intensity={LIQUID_GLASS.material.secondary.blur}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.secondaryGlassTint} />
              <Heart size={20} color="#FA2D48" fill="#FA2D48" />
              <Text style={styles.statValue}>{likedTracks.length}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>

            <View style={styles.statGlassCard}>
              <BlurView
                intensity={LIQUID_GLASS.material.secondary.blur}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.secondaryGlassTint} />
              <Headphones size={20} color="#FFF0F0" />
              <Text style={styles.statValue}>320 kbps</Text>
              <Text style={styles.statLabel}>Lossless Hi-Fi</Text>
            </View>

            <View style={styles.statGlassCard}>
              <BlurView
                intensity={LIQUID_GLASS.material.secondary.blur}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.secondaryGlassTint} />
              <Sliders size={20} color="#007AFF" />
              <Text style={styles.statValue}>10-Band</Text>
              <Text style={styles.statLabel}>Studio EQ</Text>
            </View>
          </View>

          {/* 4. Cloud Liked Tracks List */}
          {likedTracks.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Sparkles size={16} color="#00D2FF" />
                  <Text style={styles.sectionTitle}>Cloud Saved Songs</Text>
                </View>
                <Text style={styles.sectionCountText}>
                  {likedTracks.length} synced
                </Text>
              </View>

              {likedTracks.slice(0, 5).map((track, idx) => {
                const isPlaying = currentTrack?.id === track.id;
                return (
                  <GlassPressable
                    key={`${track.id}-${idx}`}
                    onPress={() => playTrack(track, likedTracks)}
                    style={styles.trackRowCard}
                    scaleTo={0.98}
                  >
                    <BlurView
                      intensity={LIQUID_GLASS.material.secondary.blur}
                      tint="dark"
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.secondaryGlassTint} />
                    <Image
                      source={{ uri: track.artworkUrl }}
                      style={styles.trackThumb}
                    />

                    <View style={styles.trackInfo}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.trackTitleText,
                          isPlaying && { color: "#00D2FF" },
                        ]}
                      >
                        {track.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.trackArtistText}>
                        {track.artist}
                      </Text>
                    </View>

                    <Heart
                      size={16}
                      color="#FA2D48"
                      fill="#FA2D48"
                      style={{ marginRight: 10 }}
                    />
                    <ChevronRight size={16} color="rgba(255, 255, 255, 0.4)" />
                  </GlassPressable>
                );
              })}
            </View>
          )}

          {/* 5. Account Action List (Grouped Glass Card) */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Account & Services</Text>

            <View style={styles.actionItemsGroup}>
              <BlurView
                intensity={LIQUID_GLASS.material.primary.blur}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.primaryGlassTint} />

              <GlassPressable
                onPress={() => navigation.navigate("AudioQualitySettings")}
                style={styles.actionRow}
                scaleTo={0.98}
              >
                <View style={styles.actionIconPill}>
                  <Volume2 size={18} color="#FFF" />
                </View>
                <View style={styles.actionMeta}>
                  <Text style={styles.actionRowTitle}>
                    Audio Quality & Equalizer
                  </Text>
                  <Text style={styles.actionRowSubtitle}>
                    Studio FLAC, 10-Band EQ & Spatial Audio
                  </Text>
                </View>
                <ChevronRight size={18} color="rgba(255, 255, 255, 0.45)" />
              </GlassPressable>

              <View style={styles.rowDivider} />

              <GlassPressable
                onPress={() => navigation.navigate("StorageCacheSettings")}
                style={styles.actionRow}
                scaleTo={0.98}
              >
                <View style={styles.actionIconPill}>
                  <Database size={18} color="#FFF" />
                </View>
                <View style={styles.actionMeta}>
                  <Text style={styles.actionRowTitle}>
                    Cloud Storage & Storage
                  </Text>
                  <Text style={styles.actionRowSubtitle}>
                    Local device scans & Supabase sync
                  </Text>
                </View>
                <ChevronRight size={18} color="rgba(255, 255, 255, 0.45)" />
              </GlassPressable>

              <View style={styles.rowDivider} />

              <GlassPressable
                onPress={handleSignOut}
                style={styles.actionRow}
                scaleTo={0.98}
              >
                <View
                  style={[
                    styles.actionIconPill,
                    { backgroundColor: "rgba(250, 45, 72, 0.15)" },
                  ]}
                >
                  <LogOut size={18} color="#be021bff" />
                </View>
                <View style={styles.actionMeta}>
                  <Text style={[styles.actionRowTitle, { color: "#be021bff" }]}>
                    Sign Out
                  </Text>
                  <Text style={styles.actionRowSubtitle}>
                    Securely terminate Supabase cloud session
                  </Text>
                </View>
                <ChevronRight size={18} color="rgba(255, 255, 255, 0.45)" />
              </GlassPressable>
            </View>
          </View>

          {/* Bottom padding for MiniPlayer visibility */}
          <View style={{ height: LIQUID_GLASS.layout.scrollBottomPadding }} />
        </ScrollView>
      )}
    </AppShell>
  );
};

const styles = StyleSheet.create({
  // ==========================================
  // HEADER
  // ==========================================

  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  headerTitleWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  headerBrandTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#E8EAF0",
    letterSpacing: 2.5,
  },

  headerSubtitle: {
    fontSize: 11,
    color: "rgba(220,225,235,0.48)",
    fontWeight: "500",
    letterSpacing: 0.3,
  },

  iconCircleGlass: {
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

  glassButtonTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  // ==========================================
  // LOADING & SCROLL
  // ==========================================

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  scrollContent: {
    paddingTop: 4,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // ==========================================
  // PRIMARY LIQUID GLASS
  // ==========================================

  heroGlassCard: {
    borderRadius: 30,
    overflow: "hidden",
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 24,
    alignItems: "center",

    backgroundColor: "rgba(25,28,34,0.58)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 12,

    marginBottom: 18,
    position: "relative",
  },

  primaryGlassTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(19,22,29,0.42)",
  },

  secondaryGlassTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  specularTopBorder: {
    position: "absolute",
    top: 0,
    left: "12%",
    right: "12%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  // ==========================================
  // PROFILE AVATAR
  // ==========================================

  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 18,
    position: "relative",
    padding: 4,

    backgroundColor: "rgba(255,255,255,0.035)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },

  avatarGlassDisc: {
    width: "100%",
    height: "100%",
    borderRadius: 46,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  avatarGlassTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  activeDotBadge: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 21,
    height: 21,
    borderRadius: 11,

    backgroundColor: "#191C22",
    borderWidth: 2,
    borderColor: "#191C22",

    alignItems: "center",
    justifyContent: "center",
  },

  activeDotCore: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#9BAF9F",
  },

  // ==========================================
  // PROFILE IDENTITY
  // ==========================================

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },

  nameDisplayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  profileNameText: {
    fontSize: 25,
    fontWeight: "800",
    color: "#E8EAF0",
    letterSpacing: -0.8,
  },

  nameInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(190,198,210,0.65)",
    paddingBottom: 5,
  },

  nameInput: {
    fontSize: 21,
    fontWeight: "700",
    color: "#E8EAF0",
    minWidth: 140,
    textAlign: "center",
  },

  saveNameBtn: {
    padding: 8,
    marginLeft: 6,
  },

  profileEmailText: {
    fontSize: 13,
    color: "rgba(220,225,235,0.50)",
    marginBottom: 20,
    letterSpacing: 0.15,
  },

  // ==========================================
  // CLOUD BADGES
  // ==========================================

  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },

  cloudBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderRadius: 20,
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  cloudBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(232,234,240,0.82)",
    letterSpacing: 0.1,
  },

  // ==========================================
  // STATISTICS
  // ==========================================

  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 30,
  },

  statGlassCard: {
    flex: 1,
    minWidth: 0,

    borderRadius: 23,
    overflow: "hidden",

    paddingVertical: 18,
    paddingHorizontal: 5,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.035)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },

  statValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#E8EAF0",
    marginTop: 12,
    marginBottom: 4,
    letterSpacing: -0.4,
  },

  statLabel: {
    fontSize: 10,
    color: "rgba(220,225,235,0.48)",
    fontWeight: "600",
    letterSpacing: 0.15,
    textAlign: "center",
  },

  // ==========================================
  // SECTION HEADERS
  // ==========================================

  sectionWrap: {
    marginBottom: 28,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#E8EAF0",
    letterSpacing: -0.55,
  },

  sectionCountText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(220,225,235,0.42)",
  },

  // ==========================================
  // SAVED TRACKS
  // ==========================================

  trackRowCard: {
    height: 72,
    borderRadius: 20,
    overflow: "hidden",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 12,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.035)",

    marginBottom: 9,
  },

  trackThumb: {
    width: 48,
    height: 48,
    borderRadius: 13,
    marginRight: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  trackInfo: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },

  trackTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E8EAF0",
    marginBottom: 4,
    letterSpacing: -0.15,
  },

  trackArtistText: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(220,225,235,0.46)",
  },

  // ==========================================
  // ACCOUNT SETTINGS GROUP
  // ==========================================

  actionItemsGroup: {
    borderRadius: 26,
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(255,255,255,0.035)",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.15,
    shadowRadius: 22,
    elevation: 8,

    marginTop: 12,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
    paddingHorizontal: 16,
    minHeight: 78,
  },

  actionIconPill: {
    width: 42,
    height: 42,
    borderRadius: 14,

    backgroundColor: "rgba(255,255,255,0.045)",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 14,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  actionMeta: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  actionRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E8EAF0",
    marginBottom: 5,
    letterSpacing: -0.15,
  },

  actionRowSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(220,225,235,0.44)",
    lineHeight: 16,
  },

  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginLeft: 72,
    marginRight: 16,
  },
});
