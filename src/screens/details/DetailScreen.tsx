import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Play, Shuffle, Disc3 } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { musicApiService } from '../../services/api/musicApiService';
import { Track } from '../../types/models';
import { RootStackParamList } from '../../navigation/types';

// Generic detail screen supporting Playlists, Artists, Albums, Profile, and Settings subpages
export const DetailScreen: React.FC<{ type: 'playlist' | 'artist' | 'album' | 'profile' | 'audio-quality' | 'storage' }> = ({ type }) => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, any>>();
  const { colors } = useThemeStore();
  const { playTrack, currentTrack } = usePlayerStore();

  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [title, setTitle] = useState('Details');
  const [subtitle, setSubtitle] = useState('Explore collection');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        if (type === 'playlist') {
          const playlistId = (route.params as any)?.playlistId || 'DOPRl';
          const plTracks = await musicApiService.getPlaylistTracks(playlistId);
          if (isMounted) {
            setTitle('Featured Playlist');
            setSubtitle(`Curated Collection • ${plTracks.length} tracks`);
            setTracks(plTracks);
          }
        } else if (type === 'artist') {
          const artistId = (route.params as any)?.artistId;
          const allTracks = await musicApiService.getTrendingTracks(30);
          const artistTracks = artistId ? allTracks.filter((t) => t.artistId === artistId || t.artist.toLowerCase().includes(String(artistId).toLowerCase())) : allTracks.slice(0, 10);
          if (isMounted) {
            setTitle(artistTracks[0]?.artist || 'Featured Artist');
            setSubtitle('Top Songs & Singles');
            setTracks(artistTracks.length > 0 ? artistTracks : allTracks.slice(0, 10));
          }
        } else if (type === 'album') {
          const allTracks = await musicApiService.getTrendingTracks(15);
          if (isMounted) {
            setTitle('Trending Album');
            setSubtitle('Exclusive Release • Lossless FLAC');
            setTracks(allTracks);
          }
        } else if (type === 'profile') {
          setTitle('User Profile');
          setSubtitle('Premium Audio Enthusiast');
        } else if (type === 'audio-quality') {
          setTitle('Streaming & Download Quality');
          setSubtitle('Configure bitrates, codecs and cellular data usage');
        } else if (type === 'storage') {
          setTitle('Storage & Cache Management');
          setSubtitle('Clear audio cache or manage local device space');
        }
      } catch (err) {
        console.warn('DetailScreen load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [type, (route.params as any)?.playlistId, (route.params as any)?.artistId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.bannerCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>

          {tracks.length > 0 && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => playTrack(tracks[0], tracks)}
                style={[styles.playButton, { backgroundColor: colors.primary }]}
              >
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.playText}>Play</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => playTrack(tracks[Math.floor(Math.random() * tracks.length)], tracks)}
                style={[styles.shuffleButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              >
                <Shuffle size={18} color={colors.textPrimary} />
                <Text style={[styles.shuffleText, { color: colors.textPrimary }]}>Shuffle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {tracks.length > 0 && (
          <View style={styles.trackList}>
            <Text style={[styles.trackListHeading, { color: colors.textPrimary }]}>Track List</Text>
            {tracks.map((t, idx) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => playTrack(t, tracks)}
                style={[styles.trackRow, { borderColor: colors.surfaceBorder }]}
              >
                <Text style={[styles.indexText, { color: colors.textMuted }]}>{idx + 1}</Text>
                <View style={styles.trackInfo}>
                  <Text numberOfLines={1} style={[styles.trackTitle, { color: colors.textPrimary }]}>
                    {t.title}
                  </Text>
                  <Text numberOfLines={1} style={[styles.trackArtist, { color: colors.textSecondary }]}>
                    {t.artist}
                  </Text>
                </View>
                <Text style={[styles.duration, { color: colors.textMuted }]}>
                  {Math.floor(t.duration / 60)}:{(t.duration % 60).toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    flex: 1,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  bannerCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  playText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  shuffleText: {
    fontWeight: '600',
    fontSize: 14,
  },
  trackList: {
    marginTop: 8,
  },
  trackListHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  indexText: {
    width: 24,
    fontSize: 13,
    fontWeight: '600',
  },
  trackInfo: {
    flex: 1,
    paddingHorizontal: 8,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 12,
  },
  duration: {
    fontSize: 12,
  },
});

