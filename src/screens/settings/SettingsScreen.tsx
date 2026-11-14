import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Palette, Volume2, HardDrive, ShieldCheck, User, ChevronRight, Sparkles } from 'lucide-react-native';
import { AppShell } from '../../components/layout/AppShell';
import { useThemeStore } from '../../store/useThemeStore';
import { ACCENT_PALETTES, AccentColor } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/types';

export const SettingsScreen: React.FC = () => {
  const { colors, accent, setAccent } = useThemeStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const availableAccents: { key: AccentColor; label: string; hex: string }[] = [
    { key: 'violet', label: 'Electric Violet', hex: ACCENT_PALETTES.violet.primary },
    { key: 'emerald', label: 'Emerald Green', hex: ACCENT_PALETTES.emerald.primary },
    { key: 'cyan', label: 'Neon Cyan', hex: ACCENT_PALETTES.cyan.primary },
    { key: 'ruby', label: 'Ruby Red', hex: ACCENT_PALETTES.ruby.primary },
    { key: 'gold', label: 'Solar Gold', hex: ACCENT_PALETTES.gold.primary },
  ];

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>

        {/* Dynamic Accent Color Switcher */}
        <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
          <View style={styles.cardHeader}>
            <Palette size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Theme & Mood Accent</Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Change your visual aesthetic on the fly. All icons, glows, and playbars will adapt immediately.
          </Text>

          <View style={styles.colorPillsContainer}>
            {availableAccents.map((item) => {
              const isSelected = accent === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setAccent(item.key)}
                  style={[
                    styles.colorPill,
                    {
                      borderColor: isSelected ? colors.textPrimary : 'transparent',
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  <View style={[styles.colorCircle, { backgroundColor: item.hex }]} />
                  <Text
                    style={[
                      styles.colorLabel,
                      { color: isSelected ? colors.textPrimary : colors.textSecondary, fontWeight: isSelected ? '700' : '400' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Premium Upgrade Teaser */}
        <TouchableOpacity
          onPress={() => navigation.navigate('PremiumSubscription')}
          style={[styles.premiumBanner, { borderColor: colors.primary }]}
        >
          <View style={styles.premiumRow}>
            <Sparkles size={24} color={colors.primary} />
            <View style={styles.premiumMeta}>
              <Text style={[styles.premiumTitle, { color: colors.textPrimary }]}>MUSIFY Premium</Text>
              <Text style={[styles.premiumSub, { color: colors.textSecondary }]}>
                Lossless audio, 4K video, no ads & unlimited downloads.
              </Text>
            </View>
            <ChevronRight size={20} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Playback & Audio Preferences */}
        <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
          <View style={styles.cardHeader}>
            <Volume2 size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Audio & Video</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('AudioQualitySettings')}
            style={[styles.settingRow, { borderColor: colors.surfaceBorder }]}
          >
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Streaming Quality</Text>
            <View style={styles.settingValueRow}>
              <Text style={[styles.settingValue, { color: colors.textMuted }]}>Lossless (FLAC)</Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('StorageCacheSettings')}
            style={[styles.settingRow, { borderColor: colors.surfaceBorder }]}
          >
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Storage & Cache</Text>
            <View style={styles.settingValueRow}>
              <Text style={[styles.settingValue, { color: colors.textMuted }]}>1.2 GB cached</Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile & Account */}
        <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
          <View style={styles.cardHeader}>
            <User size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Account</Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('UserProfile')}
            style={[styles.settingRow, { borderColor: colors.surfaceBorder }]}
          >
            <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>View Profile</Text>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('AuthStack')}
            style={[styles.settingRow, { borderColor: colors.surfaceBorder, borderBottomWidth: 0 }]}
          >
            <Text style={[styles.settingLabel, { color: colors.error }]}>Log Out</Text>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  colorPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  colorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  colorLabel: {
    fontSize: 13,
  },
  premiumBanner: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  premiumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumMeta: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  premiumSub: {
    fontSize: 12,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 13,
  },
});

