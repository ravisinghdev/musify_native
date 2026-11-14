import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, ListMusic, FileText } from 'lucide-react-native';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useThemeStore } from '../../store/useThemeStore';

export const FullPlayerModal: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useThemeStore();
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
  } = usePlayerStore();

  if (!currentTrack) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>No media playing</Text>
      </View>
    );
  }

  const isPlaying = playbackStatus === 'playing';
  const progressRatio = duration > 0 ? Math.min(position / duration, 1) : 0;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <ChevronDown size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>PLAYING FROM PLAYLIST</Text>
          <Text numberOfLines={1} style={[styles.headerMain, { color: colors.textPrimary }]}>
            {currentTrack.album || 'Featured Mix'}
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Artwork */}
        <View style={styles.artworkContainer}>
          <Image source={{ uri: currentTrack.artworkUrl }} style={styles.artwork} />
        </View>

        {/* Track Details & Favorite */}
        <View style={styles.metaRow}>
          <View style={styles.textDetails}>
            <Text numberOfLines={1} style={[styles.trackTitle, { color: colors.textPrimary }]}>
              {currentTrack.title}
            </Text>
            <Text numberOfLines={1} style={[styles.artistName, { color: colors.textSecondary }]}>
              {currentTrack.artist}
            </Text>
          </View>
          <TouchableOpacity style={styles.heartButton}>
            <Heart
              size={24}
              color={currentTrack.isLiked ? colors.primary : colors.textMuted}
              fill={currentTrack.isLiked ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Progress Bar & Timers */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceBorder }]}>
            <View style={[styles.progressFill, { width: `${progressRatio * 100}%`, backgroundColor: colors.primary }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(position)}</Text>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Main Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={toggleShuffle}>
            <Shuffle size={20} color={isShuffle ? colors.primary : colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity onPress={previousTrack}>
            <SkipBack size={28} color={colors.textPrimary} fill={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={togglePlayPause}
            style={[styles.mainPlayBtn, { backgroundColor: colors.primary }]}
          >
            {isPlaying ? (
              <Pause size={28} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={nextTrack}>
            <SkipForward size={28} color={colors.textPrimary} fill={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleRepeat}>
            <Repeat size={20} color={repeatMode !== 'off' ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Quick Drawer Utilities */}
        <View style={[styles.drawerCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
          <View style={styles.drawerHeader}>
            <FileText size={18} color={colors.primary} />
            <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>Live Synced Lyrics</Text>
          </View>
          <Text style={[styles.lyricsSnippet, { color: colors.textSecondary }]}>
            {currentTrack.lyrics?.[0] || 'Lyrics preview unavailable for this track.'}
          </Text>
          <Text style={[styles.lyricsSnippetActive, { color: colors.primary }]}>
            {currentTrack.lyrics?.[1] || 'Enjoy the high-fidelity acoustic performance.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerMain: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  artworkContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  artwork: {
    width: 290,
    height: 290,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  textDetails: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '500',
  },
  heartButton: {
    padding: 6,
  },
  progressContainer: {
    marginBottom: 28,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  mainPlayBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  lyricsSnippet: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  lyricsSnippetActive: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
});

