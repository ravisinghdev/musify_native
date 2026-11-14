import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check, Sparkles, Shield, Zap, Music2, DownloadCloud } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';

export const PremiumSubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeStore();

  const perks = [
    { title: 'Ad-Free High-Fidelity Audio', desc: 'Listen without interruptions in studio master FLAC quality.' },
    { title: '4K Ultra HD Video Streaming', desc: 'Watch exclusive music videos, concerts, and backstage sessions.' },
    { title: 'Unlimited Offline Downloads', desc: 'Save entire albums, mixes, and videos directly to your device.' },
    { title: 'Background Audio Playback', desc: 'Keep listening while using other apps or with your phone screen off.' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>MUSIFY Premium</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Glow Header */}
        <View style={[styles.heroCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
          <Sparkles size={36} color={colors.primary} style={{ alignSelf: 'center', marginBottom: 10 }} />
          <Text style={[styles.heroHeading, { color: colors.textPrimary }]}>Unlock The Ultimate Experience</Text>
          <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
            Immerse yourself into pure uncompressed acoustics and vivid 4K visual stages.
          </Text>
        </View>

        {/* Perks list */}
        <View style={styles.perksContainer}>
          {perks.map((perk, index) => (
            <View key={index} style={[styles.perkRow, { borderColor: colors.surfaceBorder }]}>
              <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                <Check size={14} color="#FFFFFF" strokeWidth={3} />
              </View>
              <View style={styles.perkText}>
                <Text style={[styles.perkTitle, { color: colors.textPrimary }]}>{perk.title}</Text>
                <Text style={[styles.perkDesc, { color: colors.textSecondary }]}>{perk.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Subscription Plan Card */}
        <View style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.planHeader}>
            <Text style={[styles.planName, { color: colors.textPrimary }]}>Premium Individual</Text>
            <View style={[styles.bestPill, { backgroundColor: colors.primary }]}>
              <Text style={styles.bestPillText}>RECOMMENDED</Text>
            </View>
          </View>
          <Text style={[styles.planPrice, { color: colors.textPrimary }]}>
            $9.99 <Text style={[styles.planPeriod, { color: colors.textMuted }]}>/ month</Text>
          </Text>
          <Text style={[styles.planTrial, { color: colors.primary }]}>1 Month Free Trial • Cancel anytime</Text>

          <TouchableOpacity style={[styles.subscribeBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.subscribeBtnText}>Start Free Trial</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroHeading: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  perksContainer: {
    marginBottom: 28,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  perkText: {
    flex: 1,
  },
  perkTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  perkDesc: {
    fontSize: 13,
    lineHeight: 17,
  },
  planCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
  },
  bestPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bestPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 14,
    fontWeight: '400',
  },
  planTrial: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 20,
  },
  subscribeBtn: {
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

