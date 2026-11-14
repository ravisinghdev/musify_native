import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Play, Pause, RotateCcw, Volume2, Maximize, Sparkles } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { Track } from '../../types/models';
import { RootStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');

export const VideoPlayerScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'VideoPlayerScreen'>>();
  const navigation = useNavigation();
  const { colors } = useThemeStore();
  const { togglePlayPause, playbackStatus, currentTrack } = usePlayerStore();

  const trackId = route.params?.trackId;
  const videoTrack: Track = currentTrack || {
    id: trackId || 'live_stream',
    title: 'Live Video Stream',
    artist: 'Musify Live',
    album: 'Live Music',
    artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    mediaUrl: '',
    duration: 300,
    type: 'video',
    views: 4890000,
    videoQuality: '1080p 60fps',
  };
  const isPlaying = playbackStatus === 'playing';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.videoTitle}>
          {videoTrack.title}
        </Text>
        <View style={styles.qualityPill}>
          <Text style={styles.qualityText}>{videoTrack.videoQuality || '1080p'}</Text>
        </View>
      </View>

      {/* Video Simulation Surface */}
      <View style={styles.videoSurface}>
        <View style={styles.videoPlaceholderContent}>
          <Sparkles size={48} color={colors.primary} />
          <Text style={styles.videoOverlayText}>Video Player Stream</Text>
          <Text style={styles.videoSubText}>{videoTrack.title} • {videoTrack.artist}</Text>
        </View>

        {/* Video Control Bar Overlay */}
        <View style={styles.controlsOverlay}>
          <TouchableOpacity onPress={togglePlayPause} style={[styles.centerPlayBtn, { backgroundColor: colors.primary }]}>
            {isPlaying ? (
              <Pause size={24} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </TouchableOpacity>
          <View style={styles.bottomBarRow}>
            <View style={styles.scrubber}>
              <View style={[styles.scrubberProgress, { width: '45%', backgroundColor: colors.primary }]} />
            </View>
            <Maximize size={18} color="#FFFFFF" style={{ marginLeft: 12 }} />
          </View>
        </View>
      </View>

      {/* Video Details & Meta */}
      <View style={styles.detailsContainer}>
        <Text style={[styles.metaHeading, { color: colors.textPrimary }]}>{videoTrack.title}</Text>
        <Text style={[styles.metaArtist, { color: colors.textSecondary }]}>{videoTrack.artist}</Text>
        <Text style={[styles.metaViews, { color: colors.textMuted }]}>
          {(videoTrack.views || 0).toLocaleString()} views • Premiered on MUSIFY
        </Text>

        <View style={[styles.featuresCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.featuresTitle, { color: colors.textPrimary }]}>Supported Video Playback Features</Text>
          <Text style={[styles.featuresDesc, { color: colors.textSecondary }]}>
            ✓ Dynamic resolution switching (4K / 1080p / 720p / Data Saver)
            {'\n'}✓ Picture-in-Picture (PiP) multitasking
            {'\n'}✓ Hardware accelerated decoding
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  videoTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  qualityPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qualityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  videoSurface: {
    width: width,
    height: (width * 9) / 16,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderContent: {
    alignItems: 'center',
    gap: 6,
  },
  videoOverlayText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  videoSubText: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  centerPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrubber: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  scrubberProgress: {
    height: '100%',
    borderRadius: 2,
  },
  detailsContainer: {
    padding: 16,
  },
  metaHeading: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  metaArtist: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaViews: {
    fontSize: 12,
    marginBottom: 20,
  },
  featuresCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  featuresDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
});

