import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Heart, Download, ListMusic, Disc3 } from 'lucide-react-native';
import { AppShell } from '../../components/layout/AppShell';
import { useThemeStore } from '../../store/useThemeStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { musicApiService } from '../../services/api/musicApiService';
import { Playlist, Track } from '../../types/models';

export const LibraryScreen: React.FC = () => {
  const { colors } = useThemeStore();
  const { playTrack, currentTrack } = usePlayerStore();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'playlists' | 'liked' | 'downloads'>('playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);

  useEffect(() => {
    musicApiService.getTrendingPlaylists().then(setPlaylists);
    musicApiService.getTrendingTracks(10).then(setLikedTracks);
  }, []);

  return (
    <AppShell>
      <View style={styles.container}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Your Library</Text>

        {/* Filter Pills */}
        <View style={styles.pillsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('playlists')}
            style={[
              styles.pill,
              {
                backgroundColor: activeTab === 'playlists' ? colors.primary : colors.surfaceElevated,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <ListMusic size={15} color={activeTab === 'playlists' ? '#FFFFFF' : colors.textSecondary} />
            <Text
              style={[
                styles.pillText,
                { color: activeTab === 'playlists' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Playlists
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('liked')}
            style={[
              styles.pill,
              {
                backgroundColor: activeTab === 'liked' ? colors.primary : colors.surfaceElevated,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <Heart size={15} color={activeTab === 'liked' ? '#FFFFFF' : colors.textSecondary} />
            <Text
              style={[
                styles.pillText,
                { color: activeTab === 'liked' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Liked ({likedTracks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('downloads')}
            style={[
              styles.pill,
              {
                backgroundColor: activeTab === 'downloads' ? colors.primary : colors.surfaceElevated,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <Download size={15} color={activeTab === 'downloads' ? '#FFFFFF' : colors.textSecondary} />
            <Text
              style={[
                styles.pillText,
                { color: activeTab === 'downloads' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Offline
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
          {activeTab === 'playlists' && (
            <View>
              {playlists.map((pl, idx) => (
                <TouchableOpacity
                  key={`${pl.id}-${idx}`}
                  onPress={() => navigation.navigate('PlaylistDetails', { playlistId: pl.id })}
                  style={[styles.libraryItem, { borderColor: colors.surfaceBorder }]}
                >
                  <Image source={{ uri: pl.coverUrl }} style={styles.itemImage} />
                  <View style={styles.itemDetails}>
                    <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.textPrimary }]}>
                      {pl.title}
                    </Text>
                    <Text numberOfLines={1} style={[styles.itemSub, { color: colors.textSecondary }]}>
                      Playlist • {pl.tracksCount} tracks
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'liked' && (
            <View>
              {likedTracks.map((tr, idx) => (
                <TouchableOpacity
                  key={`${tr.id}-${idx}`}
                  onPress={() => playTrack(tr, likedTracks)}
                  style={[styles.libraryItem, { borderColor: colors.surfaceBorder }]}
                >
                  <Image source={{ uri: tr.artworkUrl }} style={styles.itemImage} />
                  <View style={styles.itemDetails}>
                    <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.textPrimary }]}>
                      {tr.title}
                    </Text>
                    <Text numberOfLines={1} style={[styles.itemSub, { color: colors.textSecondary }]}>
                      {tr.artist}
                    </Text>
                  </View>
                  <Heart size={18} color={colors.primary} fill={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activeTab === 'downloads' && (
            <View style={styles.emptyContainer}>
              <Download size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No offline downloads yet</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Download songs and videos to enjoy uninterrupted media playback without internet.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollList: {
    paddingBottom: 24,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginRight: 14,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  itemSub: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

