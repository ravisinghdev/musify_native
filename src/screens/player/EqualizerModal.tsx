import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import {
  Sliders,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react-native";
import {
  useEqualizerStore,
  EQ_FREQUENCIES,
  PRESET_VALUES,
  EqPreset,
} from "../../store/useEqualizerStore";
import { useThemeStore } from "../../store/useThemeStore";
import { hapticFeedback } from "../../utils/haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PRESETS: EqPreset[] = [
  "Flat",
  "Bass Boost",
  "Vocal Boost",
  "Electronic",
  "Rock",
  "Pop",
  "Acoustic",
  "Hip-Hop",
  "Jazz",
  "Classical",
];

export const EqualizerModal: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const {
    isEnabled,
    selectedPreset,
    bands,
    bassBoost,
    virtualizer,
    crossfadeDuration,
    toggleEqualizer,
    setPreset,
    setBandGain,
    setBassBoost,
    setVirtualizer,
    setCrossfadeDuration,
    resetToFlat,
  } = useEqualizerStore();

  const handleBandStep = (index: number, delta: number) => {
    hapticFeedback.light();
    setBandGain(index, bands[index] + delta);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeContainer}>
      {/* 1. Header Bar with Glass Back Button & Reset */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.glassCircleBtn}
          activeOpacity={0.8}
        >
          <BlurView
            intensity={70}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <ChevronDown size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>10-Band Equalizer</Text>
          <Text style={styles.headerSubtitle}>Audiophile Sound Studio</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            hapticFeedback.medium();
            resetToFlat();
          }}
          style={styles.glassCircleBtn}
          activeOpacity={0.8}
        >
          <BlurView
            intensity={70}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <RotateCcw size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Master Power Switch Pill */}
        <View style={styles.masterPillCard}>
          <BlurView
            intensity={75}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glassWash} />

          <View style={styles.masterInfo}>
            <Sliders
              size={20}
              color={isEnabled ? colors.primary : "rgba(255,255,255,0.4)"}
            />
            <View>
              <Text style={styles.masterTitle}>DSP Audio Engine</Text>
              <Text style={styles.masterSubtitle}>
                {isEnabled
                  ? "Active • 32-bit floating point"
                  : "Bypassed • Direct stream"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              hapticFeedback.medium();
              toggleEqualizer();
            }}
            style={[
              styles.powerToggleBtn,
              {
                backgroundColor: isEnabled
                  ? colors.primary
                  : "rgba(255,255,255,0.1)",
              },
            ]}
          >
            <Text
              style={[
                styles.powerToggleText,
                { color: isEnabled ? "#000000" : "#FFFFFF" },
              ]}
            >
              {isEnabled ? "ON" : "OFF"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Preset Carousel Pills */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Acoustic Presets</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetScroll}
        >
          {PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset;
            return (
              <TouchableOpacity
                key={preset}
                activeOpacity={0.85}
                onPress={() => {
                  hapticFeedback.light();
                  setPreset(preset);
                }}
                style={[
                  styles.presetPill,
                  isSelected && [
                    styles.presetPillActive,
                    {
                      borderColor: colors.primary,
                      backgroundColor: 'rgba(255, 255, 255, 0.14)',
                    },
                  ],
                ]}
              >
                <BlurView
                  intensity={isSelected ? 90 : 60}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                <Text
                  style={[
                    styles.presetPillText,
                    isSelected
                      ? [styles.presetTextActive, { color: colors.primary }]
                      : styles.presetTextInactive,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 4. 10-Band Graphic Slider Visualizer */}
        <View style={styles.eqRackCard}>
          <BlurView
            intensity={75}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glassWash} />

          <View style={styles.eqRackHeader}>
            <Text style={styles.eqRackTitle}>Frequency Response Curve</Text>
            <Text style={styles.eqRackDb}>±12 dB</Text>
          </View>

          {/* 10 Vertical Bands */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bandsRow}
          >
            {EQ_FREQUENCIES.map((freq, idx) => {
              const gain = bands[idx] || 0;
              // Normalize -12dB to +12dB into 0% to 100% height (slider track 150px)
              const ratio = (gain + 12) / 24;

              return (
                <View key={freq} style={styles.bandCol}>
                  <Text style={styles.gainText}>
                    {gain > 0 ? `+${gain}` : `${gain}`}
                  </Text>

                  {/* Vertical Track */}
                  <View style={styles.trackGroove}>
                    <View
                      style={[
                        styles.trackFill,
                        {
                          height: `${Math.round(ratio * 100)}%`,
                          backgroundColor: isEnabled
                            ? colors.primary
                            : "rgba(255,255,255,0.25)",
                        },
                      ]}
                    />
                    {/* Interactive Tap Step Buttons */}
                    <TouchableOpacity
                      onPress={() => handleBandStep(idx, 1)}
                      style={styles.bandTapTop}
                    />
                    <TouchableOpacity
                      onPress={() => handleBandStep(idx, -1)}
                      style={styles.bandTapBottom}
                    />
                  </View>

                  <Text style={styles.freqText}>{freq}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* 5. Bass Boost & Virtualizer Studio Dials */}
        <View style={styles.fxCardsRow}>
          {/* Bass Boost Card */}
          <View style={styles.fxCard}>
            <BlurView
              intensity={75}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassWash} />

            <View style={styles.fxHeader}>
              <Zap size={18} color={colors.primary} />
              <Text style={styles.fxTitle}>Bass Boost</Text>
            </View>
            <Text style={[styles.fxValueText, { color: colors.primary }]}>{bassBoost}%</Text>

            <View style={styles.fxSteppers}>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  setBassBoost(bassBoost - 10);
                }}
                style={styles.fxStepBtn}
              >
                <Text style={styles.fxStepBtnText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  setBassBoost(bassBoost + 10);
                }}
                style={[styles.fxStepBtn, { borderColor: colors.primary }]}
              >
                <Text style={[styles.fxStepBtnText, { color: colors.primary }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Virtualizer Spatial Card */}
          <View style={styles.fxCard}>
            <BlurView
              intensity={75}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassWash} />

            <View style={styles.fxHeader}>
              <Waves size={18} color={colors.primary} />
              <Text style={styles.fxTitle}>Virtualizer</Text>
            </View>
            <Text style={[styles.fxValueText, { color: colors.primary }]}>{virtualizer}%</Text>

            <View style={styles.fxSteppers}>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  setVirtualizer(virtualizer - 10);
                }}
                style={styles.fxStepBtn}
              >
                <Text style={styles.fxStepBtnText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  hapticFeedback.light();
                  setVirtualizer(virtualizer + 10);
                }}
                style={[styles.fxStepBtn, { borderColor: colors.primary }]}
              >
                <Text style={[styles.fxStepBtnText, { color: colors.primary }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 6. Dynamic Crossfade Card */}
        <View style={styles.crossfadeCard}>
          <BlurView
            intensity={75}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glassWash} />

          <View style={styles.crossfadeHeader}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Sparkles size={18} color={colors.primary} />
              <View>
                <Text style={styles.crossfadeTitle}>Seamless Crossfade</Text>
                <Text style={styles.crossfadeSubtitle}>
                  {crossfadeDuration > 0
                    ? `Blending consecutive tracks over ${crossfadeDuration}s`
                    : "Instant track cut (0s)"}
                </Text>
              </View>
            </View>
            <Text style={[styles.crossfadeValue, { color: colors.primary }]}>{crossfadeDuration}s</Text>
          </View>

          {/* Preset Buttons */}
          <View style={styles.crossfadePresetsRow}>
            {[0, 2, 4, 6, 8, 12].map((sec) => {
              const isSelected = crossfadeDuration === sec;
              return (
                <TouchableOpacity
                  key={sec}
                  onPress={() => {
                    hapticFeedback.light();
                    setCrossfadeDuration(sec);
                  }}
                  style={[
                    styles.crossfadeBtn,
                    isSelected && [
                      styles.crossfadeBtnActive,
                      { backgroundColor: colors.primary, borderColor: colors.primary },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.crossfadeBtnText,
                      isSelected && {
                        color: "#000000",
                        fontWeight: "800",
                      },
                    ]}
                  >
                    {sec === 0 ? "Off" : `${sec}s`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ==========================================
  // ROOT
  // ==========================================

  safeContainer: {
    flex: 1,
    backgroundColor: "#101216",
  },

  // ==========================================
  // HEADER
  // ==========================================

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  headerTitleWrap: {
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E8EAF0",
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    fontSize: 12,
    color: "rgba(220,225,235,0.46)",
    marginTop: 2,
  },

  glassCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  // ==========================================
  // SCROLL
  // ==========================================

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // ==========================================
  // MASTER CONTROL
  // ==========================================

  masterPillCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 24,
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(255,255,255,0.035)",

    marginBottom: 22,
    marginTop: 4,
  },

  glassWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  masterInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  masterTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#E8EAF0",
  },

  masterSubtitle: {
    fontSize: 12,
    color: "rgba(220,225,235,0.46)",
    marginTop: 3,
  },

  powerToggleBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  powerToggleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#C4CBD5",
  },

  // ==========================================
  // SECTION HEADERS
  // ==========================================

  sectionHeaderRow: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#E8EAF0",
    letterSpacing: -0.2,
  },

  // ==========================================
  // PRESET PILLS
  // ==========================================

  presetScroll: {
    gap: 8,
    paddingBottom: 18,
  },

  presetPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  presetPillActive: {
    borderColor: "rgba(220,225,235,0.38)",
    backgroundColor: "rgba(220,225,235,0.10)",
  },

  presetPillText: {
    fontSize: 13,
  },

  presetTextActive: {
    color: "#E8EAF0",
    fontWeight: "800",
  },

  presetTextInactive: {
    color: "rgba(220,225,235,0.62)",
    fontWeight: "600",
  },

  // ==========================================
  // EQUALIZER RACK
  // ==========================================

  eqRackCard: {
    padding: 16,
    borderRadius: 24,
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.035)",

    marginBottom: 18,
  },

  eqRackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  eqRackTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E8EAF0",
  },

  eqRackDb: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(220,225,235,0.48)",
  },

  // ==========================================
  // EQUALIZER BANDS
  // ==========================================

  bandsRow: {
    gap: 14,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },

  bandCol: {
    alignItems: "center",
    width: 38,
  },

  gainText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B8C0CC",
    marginBottom: 8,
  },

  trackGroove: {
    width: 8,
    height: 140,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.10)",
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative",
  },

  trackFill: {
    width: "100%",
    borderRadius: 4,
    backgroundColor: "#AEB7C5",
  },

  bandTapTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
  },

  bandTapBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  },

  freqText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(220,225,235,0.48)",
    marginTop: 9,
  },

  // ==========================================
  // FX CARDS
  // ==========================================

  fxCardsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },

  fxCard: {
    flex: 1,
    padding: 16,
    borderRadius: 23,
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  fxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 9,
  },

  fxTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#E8EAF0",
  },

  fxValueText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#C4CBD5",
    letterSpacing: -0.5,
    marginBottom: 12,
  },

  fxSteppers: {
    flexDirection: "row",
    gap: 8,
  },

  fxStepBtn: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
  },

  fxStepBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#D9DDE5",
  },

  // ==========================================
  // CROSSFADE
  // ==========================================

  crossfadeCard: {
    padding: 16,
    borderRadius: 23,
    overflow: "hidden",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  crossfadeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  crossfadeTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#E8EAF0",
  },

  crossfadeSubtitle: {
    fontSize: 12,
    color: "rgba(220,225,235,0.46)",
    marginTop: 3,
  },

  crossfadeValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#C4CBD5",
  },

  crossfadePresetsRow: {
    flexDirection: "row",
    gap: 8,
  },

  crossfadeBtn: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    justifyContent: "center",
  },

  crossfadeBtnActive: {
    backgroundColor: "rgba(220,225,235,0.13)",
    borderColor: "rgba(220,225,235,0.28)",
  },

  crossfadeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(220,225,235,0.58)",
  },
});
