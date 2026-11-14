import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, Sparkles, Play, Video, Disc3 } from 'lucide-react-native';
import { AppShell } from '../../components/layout/AppShell';
import { useThemeStore } from '../../store/useThemeStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { musicApiService } from '../../services/api/musicApiService';
import { Track, Playlist, Artist } from '../../types/models';
import { RootStackParamList } from '../../navigation/types';

export const HomeScreen: React.FC = () => {
  const { colors } = useThemeStore();
  const { playTrack, currentTrack } = usePlayerStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadLiveData() {
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
        console.warn('Failed to load live home data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLiveData();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredTrack = tracks[0];

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Good evening</Text>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
              MUSI<Text style={{ color: colors.primary }}>FY</Text>
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => navigation.navigate('NotificationCenter')}
              style={[styles.iconPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}
            >
              <Bell size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('PremiumSubscription')}
              style={[styles.iconPill, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}
            >
              <Sparkles size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Picks / Featured Banner */}
        {featuredTrack && (
          <View style={[styles.featuredBanner, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
            <View style={styles.featuredBadge}>
              <Text style={[styles.featuredBadgeText, { color: colors.primary }]}>FEATURED STREAM</Text>
            </View>
            <Text numberOfLines={1} style={[styles.featuredTitle, { color: colors.textPrimary }]}>
              {featuredTrack.title}
            </Text>
            <Text numberOfLines={2} style={[styles.featuredSubtitle, { color: colors.textSecondary }]}>
              Streaming by {featuredTrack.artist} • Lossless High-Fidelity Audio
            </Text>
            <TouchableOpacity
              onPress={() => playTrack(featuredTrack, tracks)}
              style={[styles.primaryPlayButton, { backgroundColor: colors.primary }]}
            >
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.playButtonText}>Stream Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading live music...</Text>
          </View>
        )}

        {/* Trending Tracks Section */}
        {tracks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Trending Tracks</Text>
            {tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <TouchableOpacity
                  key={`${track.id}-${idx}`}
                  onPress={() => playTrack(track, tracks)}
                  style={[
                    styles.trackRow,
                    {
                      backgroundColor: isCurrent ? colors.surfaceElevated : 'transparent',
                      borderColor: colors.surfaceBorder,
                    },
                  ]}
                >
                  <Image source={{ uri: track.artworkUrl }} style={styles.trackThumb} />
                  <View style={styles.trackInfo}>
                    <Text numberOfLines={1} style={[styles.trackName, { color: isCurrent ? colors.primary : colors.textPrimary }]}>
                      {track.title}
                    </Text>
                    <Text numberOfLines={1} style={[styles.trackArtist, { color: colors.textSecondary }]}>
                      {track.artist}
                    </Text>
                  </View>
                  <Disc3 size={18} color={isCurrent ? colors.primary : colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Curated Playlists Carousel */}
        {playlists.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Curated Collections</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
              {playlists.map((playlist, idx) => (
                <TouchableOpacity
                  key={`${playlist.id}-${idx}`}
                  onPress={() => navigation.navigate('PlaylistDetails', { playlistId: playlist.id })}
                  style={[styles.playlistCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                >
                  <Image source={{ uri: playlist.coverUrl }} style={styles.playlistCover} />
                  <Text numberOfLines={1} style={[styles.playlistName, { color: colors.textPrimary }]}>
                    {playlist.title}
                  </Text>
                  <Text numberOfLines={2} style={[styles.playlistDescription, { color: colors.textMuted }]}>
                    {playlist.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Artists */}
        {artists.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Popular Artists</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContainer}>
              {artists.map((artist, idx) => (
                <TouchableOpacity
                  key={`${artist.id}-${idx}`}
                  onPress={() => navigation.navigate('ArtistProfile', { artistId: artist.id })}
                  style={styles.artistCard}
                >
                  <Image source={{ uri: artist.avatarUrl }} style={[styles.artistAvatar, { borderColor: colors.surfaceBorder }]} />
                  <Text numberOfLines={1} style={[styles.artistName, { color: colors.textPrimary }]}>
                    {artist.name}
                  </Text>
                  <Text style={[styles.artistFollowers, { color: colors.textMuted }]}>
                    {(artist.monthlyListeners / 1000000).toFixed(1)}M listeners
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 18,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  iconPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBanner: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
  },
  featuredBadge: {
    marginBottom: 8,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  featuredSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  primaryPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 6,
  },
  trackThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  trackArtist: {
    fontSize: 13,
  },
  carouselContainer: {
    gap: 14,
  },
  playlistCard: {
    width: 150,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  playlistCover: {
    width: 130,
    height: 130,
    borderRadius: 10,
    marginBottom: 10,
  },
  playlistName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  playlistDescription: {
    fontSize: 11,
    lineHeight: 15,
  },
  artistCard: {
    width: 110,
    alignItems: 'center',
  },
  artistAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  artistName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  artistFollowers: {
    fontSize: 11,
    textAlign: 'center',
  },
});

