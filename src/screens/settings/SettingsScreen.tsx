import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from "react-native";
import {
  Sliders,
  Volume2,
  HardDrive,
  Bell,
  Lock,
  ChevronRight,
  ShieldCheck,
  Headphones,
  Zap,
  Sparkles,
  Database,
  User,
  LogOut,
} from "lucide-react-native";
import { BlurView } from "expo-blur";
import { AppShell } from "../../components/layout/AppShell";
import { useThemeStore } from "../../store/useThemeStore";
import { ACCENT_PALETTES, AccentColor } from "../../constants/theme";
import {
  cloudService,
  UserProfile,
} from "../../services/supabase/cloudService";
import { useNavigation } from "@react-navigation/native";
import { hapticFeedback } from "../../utils/haptics";

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, accent, setAccent } = useThemeStore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [losslessStreaming, setLosslessStreaming] = useState(true);
  const [spatialAudio, setSpatialAudio] = useState(true);
  const [gaplessPlayback, setGaplessPlayback] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);

  React.useEffect(() => {
    cloudService.getCurrentUser().then(setUserProfile);
  }, []);

  const handleSignOut = async () => {
    hapticFeedback.medium();
    await cloudService.signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: "AuthScreen" }],
    });
  };

  const accentKeys: AccentColor[] = [
    "obsidianGlass",
    "pearlGlass",
    "midnightLuxe",
  ];

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Personalization, cloud sync & AI
          </Text>
        </View>

        {/* 0. Supabase Cloud Account Card */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>CLOUD PROFILE & SUPABASE</Text>

          <View style={styles.liquidCard}>
            <BlurView
              intensity={75}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassWash} />

            <View style={{ padding: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "rgba(0, 210, 255, 0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "rgba(0, 210, 255, 0.3)",
                    }}
                  >
                    <User size={22} color={colors.primary} />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: "#FFFFFF",
                      }}
                    >
                      {userProfile?.name || "Musify Member"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "rgba(255, 255, 255, 0.55)",
                        marginTop: 2,
                      }}
                    >
                      {userProfile?.email || "Cloud Synced"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSignOut}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 14,
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.14)",
                  }}
                >
                  <LogOut size={14} color="rgba(255, 255, 255, 0.65)" />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: "rgba(255, 255, 255, 0.75)",
                    }}
                  >
                    Sign Out
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    backgroundColor: "rgba(0, 210, 255, 0.08)",
                  }}
                >
                  <Database size={12} color={colors.primary} />
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.primary,
                      fontWeight: "700",
                    }}
                  >
                    Postgres Cloud Active
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <Sparkles size={12} color={colors.primaryLight} />
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.primaryLight,
                      fontWeight: "700",
                    }}
                  >
                    AI Assistant Ready
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 1. Accent Color Palette Selector Card */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>ACCENT COLOR & GLOW</Text>

          <View style={styles.liquidCard}>
            <BlurView
              intensity={75}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassWash} />

            <View style={styles.palettesGrid}>
              {accentKeys.map((key) => {
                const palette = ACCENT_PALETTES[key];
                const isSelected = accent === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      hapticFeedback.selection();
                      setAccent(key);
                    }}
                    style={[
                      styles.paletteOption,
                      isSelected && [
                        styles.paletteOptionSelected,
                        { borderColor: palette.primary, backgroundColor: 'rgba(255, 255, 255, 0.12)' },
                      ],
                    ]}
                  >
                    <View
                      style={[
                        styles.paletteDot,
                        {
                          backgroundColor: palette.primary,
                          shadowColor: palette.primary,
                          shadowOpacity: isSelected ? 0.6 : 0.2,
                          shadowRadius: isSelected ? 8 : 2,
                          elevation: isSelected ? 4 : 1,
                        },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.paletteLabel,
                          isSelected && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        {palette.label}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 10,
                          color: 'rgba(255, 255, 255, 0.45)',
                          marginTop: 2,
                        }}
                      >
                        {palette.sublabel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 2. Audio Fidelity & Spatial Controls Card */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>AUDIO & FIDELITY</Text>

          <View style={styles.liquidCard}>
            <BlurView
              intensity={75}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassWash} />

            <View style={styles.settingRow}>
              <View style={styles.settingIconWrap}>
                <Headphones size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Lossless 320kbps Audio</Text>
                <Text style={styles.settingSubtitle}>
                  Master quality low-latency stream
                </Text>
              </View>
              <Switch
                value={losslessStreaming}
                onValueChange={(val) => {
                  hapticFeedback.light();
                  setLosslessStreaming(val);
                }}
                trackColor={{
                  false: "rgba(255,255,255,0.2)",
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingIconWrap}>
                <Zap size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>
                  Spatial Audio & Dolby Atmos
                </Text>
                <Text style={styles.settingSubtitle}>
                  Virtual 3D immersive surround sound
                </Text>
              </View>
              <Switch
                value={spatialAudio}
                onValueChange={(val) => {
                  hapticFeedback.light();
                  setSpatialAudio(val);
                }}
                trackColor={{
                  false: "rgba(255,255,255,0.2)",
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingIconWrap}>
                <Volume2 size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>
                  Gapless Playback & Crossfade
                </Text>
                <Text style={styles.settingSubtitle}>
                  Smooth 2-second crossfade transitions
                </Text>
              </View>
              <Switch
                value={gaplessPlayback}
                onValueChange={(val) => {
                  hapticFeedback.light();
                  setGaplessPlayback(val);
                }}
                trackColor={{
                  false: "rgba(255,255,255,0.2)",
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* 3. System & Data Preferences */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>SYSTEM & DATA</Text>

          <View style={styles.liquidCard}>
            <BlurView
              intensity={75}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassWash} />

            <TouchableOpacity style={styles.menuRow} activeOpacity={0.8}>
              <View style={styles.settingIconWrap}>
                <HardDrive size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Storage & Cache Manager</Text>
                <Text style={styles.settingSubtitle}>
                  Clear cached offline streams & lyrics
                </Text>
              </View>
              <ChevronRight size={18} color="rgba(255, 255, 255, 0.45)" />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity style={styles.menuRow} activeOpacity={0.8}>
              <View style={styles.settingIconWrap}>
                <ShieldCheck size={20} color="#FFFFFF" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Privacy & Policies</Text>
                <Text style={styles.settingSubtitle}>
                  Telemetry & offline listening modes
                </Text>
              </View>
              <ChevronRight size={18} color="rgba(255, 255, 255, 0.45)" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  // ==========================================
  // SCROLL CONTAINER
  // ==========================================

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 170,
  },

  // ==========================================
  // HEADER
  // ==========================================

  headerRow: {
    marginBottom: 20,
    marginTop: 4,
  },

  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#E8EAF0",
    letterSpacing: -0.8,
    marginBottom: 3,
  },

  headerSubtitle: {
    fontSize: 13,
    color: "rgba(220,225,235,0.48)",
    letterSpacing: 0.1,
  },

  // ==========================================
  // SECTIONS
  // ==========================================

  sectionBlock: {
    marginBottom: 26,
  },

  sectionHeading: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: "rgba(220,225,235,0.48)",
    marginBottom: 12,
    marginLeft: 5,
    textTransform: "uppercase",
  },

  // ==========================================
  // LIQUID GLASS CARD
  // ==========================================

  liquidCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "rgba(25,28,34,0.48)",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 8,
  },

  glassWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  // ==========================================
  // COLOR PALETTE GRID
  // ==========================================

  palettesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 14,
    gap: 10,
  },

  paletteOption: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.025)",

    gap: 12,
  },

  paletteOptionSelected: {
    borderWidth: 1.4,
    borderColor: "rgba(220,225,235,0.42)",
    backgroundColor: "rgba(255,255,255,0.075)",
  },

  paletteDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },

  paletteLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#D9DDE5",
    flex: 1,
  },

  // ==========================================
  // SETTINGS ROW
  // ==========================================

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    minHeight: 72,
  },

  // ==========================================
  // MENU ROW
  // ==========================================

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    minHeight: 72,
  },

  // ==========================================
  // SETTINGS ICON
  // ==========================================

  settingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,

    backgroundColor: "rgba(255,255,255,0.045)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",

    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  // ==========================================
  // SETTINGS TEXT
  // ==========================================

  settingInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E8EAF0",
    marginBottom: 4,
    letterSpacing: -0.15,
  },

  settingSubtitle: {
    fontSize: 12,
    color: "rgba(220,225,235,0.46)",
    lineHeight: 17,
  },

  // ==========================================
  // DIVIDERS
  // ==========================================

  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.09)",
    marginLeft: 70,
    marginRight: 16,
  },
});
