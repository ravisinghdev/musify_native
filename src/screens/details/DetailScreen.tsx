import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Shuffle, Heart, MoreVertical, Disc3, Clock } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { musicApiService } from '../../services/api/musicApiService';
import { Track } from '../../types/models';
import { RootStackParamList } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const DetailScreen: React.FC<{
  type: 'playlist' | 'artist' | 'album' | 'profile' | 'audio-quality' | 'storage';
}> = ({ type }) => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, any>>();
  const { colors } = useThemeStore();
  const { playTrack, currentTrack } = usePlayerStore();

  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [title, setTitle] = useState('Details');
  const [subtitle, setSubtitle] = useState('Explore collection');
  const [coverUrl, setCoverUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        if (type === 'playlist') {
          const playlistId = (route.params as any)?.playlistId || 'DOPRl';
          const plTracks = await musicApiService.getPlaylistTracks(playlistId);
          if (isMounted) {
            setTitle('Top 100 Songs 2026');
            setSubtitle('Curated by MUSIFY • 100 songs • 5 hrs 30 mins');
            setCoverUrl(
              plTracks[0]?.artworkUrl ||
                'https://c.saavncdn.com/editorial/Top100Hindi2024_20241219062325_500x500.jpg'
            );
            setTracks(plTracks);
          }
        } else if (type === 'artist') {
          const artistId = (route.params as any)?.artistId;
          const allTracks = await musicApiService.getTrendingTracks(30);
          const artistTracks = artistId
            ? allTracks.filter(
                (t) =>
                  t.artistId === artistId ||
                  t.artist.toLowerCase().includes(String(artistId).toLowerCase())
              )
            : allTracks.slice(0, 15);
          if (isMounted) {
            setTitle(artistTracks[0]?.artist || 'Featured Artist');
            setSubtitle('12.4M monthly listeners • Verified Artist');
            setCoverUrl(artistTracks[0]?.artworkUrl || '');
            setTracks(artistTracks.length > 0 ? artistTracks : allTracks.slice(0, 15));
          }
        } else if (type === 'album') {
          const allTracks = await musicApiService.getTrendingTracks(15);
          if (isMounted) {
            setTitle(allTracks[0]?.album || 'Moonlight Album');
            setSubtitle(`${allTracks[0]?.artist || 'Various Artists'} • 2026 • 12 songs`);
            setCoverUrl(allTracks[0]?.artworkUrl || '');
            setTracks(allTracks);
          }
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
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.container, { backgroundColor: '#070709' }]}>
      {/* Top Navigation Row */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={[styles.headerTitleText, { color: colors.textPrimary }]}>
          {type === 'playlist' ? 'Playlist' : type === 'artist' ? 'Artist' : 'Album'}
        </Text>
        <TouchableOpacity style={styles.headerIconButton}>
          <MoreVertical size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Artwork with Ambient Shadow */}
        <View style={styles.heroArtworkWrap}>
          <View style={[styles.ambientShadow, { backgroundColor: colors.primary, shadowColor: colors.primary }]} />
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={[styles.heroCover, type === 'artist' && { borderRadius: 100 }]}
            />
          ) : (
            <View style={[styles.heroCoverFallback, { backgroundColor: '#16161B' }]}>
              <Disc3 size={60} color={colors.primary} />
            </View>
          )}
        </View>

        {/* Title, Subtitle, and Action Pills */}
        <View style={styles.metaContainer}>
          <Text numberOfLines={1} style={[styles.mainTitle, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Text numberOfLines={2} style={[styles.subTitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>

          {/* Action Row: Big Play Pill + Shuffle Button */}
          {tracks.length > 0 && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => playTrack(tracks[0], tracks)}
                style={[styles.primaryPlayPill, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
              >
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                <Text style={styles.playPillText}>Play All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => playTrack(tracks[Math.floor(Math.random() * tracks.length)], tracks)}
                style={[styles.shufflePill, { backgroundColor: '#16161B', borderColor: 'rgba(255,255,255,0.08)' }]}
              >
                <Shuffle size={18} color={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.shufflePill, { backgroundColor: '#16161B', borderColor: 'rgba(255,255,255,0.08)' }]}
              >
                <Heart size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Track List Section */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading songs...</Text>
          </View>
        ) : (
          <View style={styles.trackListContainer}>
            {tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const mins = Math.floor((track.duration || 180) / 60);
              const secs = Math.floor((track.duration || 180) % 60);
              const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

              return (
                <TouchableOpacity
                  key={`${track.id}-${idx}`}
                  activeOpacity={0.78}
                  onPress={() => playTrack(track, tracks)}
                  style={[
                    styles.trackItemRow,
                    {
                      backgroundColor: isCurrent ? '#1A1A22' : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.trackIndex, { color: isCurrent ? colors.primary : colors.textMuted }]}>
                    {idx + 1}
                  </Text>
                  <Image source={{ uri: track.artworkUrl }} style={styles.trackThumbnail} />

                  <View style={styles.trackItemMeta}>
                    <Text
                      numberOfLines={1}
                      style={[styles.trackItemTitle, { color: isCurrent ? colors.primary : colors.textPrimary }]}
                    >
                      {track.title}
                    </Text>
                    <Text numberOfLines={1} style={[styles.trackItemArtist, { color: colors.textSecondary }]}>
                      {track.artist}
                    </Text>
                  </View>

                  <Text style={[styles.durationText, { color: colors.textMuted }]}>{durationStr}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerIconButton: {
    padding: 6,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  heroArtworkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 20,
    position: 'relative',
  },
  ambientShadow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.52,
    height: SCREEN_WIDTH * 0.52,
    borderRadius: 30,
    opacity: 0.35,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 16,
  },
  heroCover: {
    width: SCREEN_WIDTH * 0.58,
    height: SCREEN_WIDTH * 0.58,
    borderRadius: 20,
  },
  heroCoverFallback: {
    width: SCREEN_WIDTH * 0.58,
    height: SCREEN_WIDTH * 0.58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryPlayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  shufflePill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  trackListContainer: {
    paddingHorizontal: 16,
  },
  trackItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 4,
  },
  trackIndex: {
    fontSize: 14,
    fontWeight: '700',
    width: 24,
  },
  trackThumbnail: {
    width: 46,
    height: 46,
    borderRadius: 10,
    marginRight: 12,
  },
  trackItemMeta: {
    flex: 1,
  },
  trackItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  trackItemArtist: {
    fontSize: 12,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
});
