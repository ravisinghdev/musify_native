import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Heart,
  Download,
  Plus,
  Play,
  Pause,
  ChevronRight,
  Sparkles,
  Folder,
  RefreshCw,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { AppShell } from '../../components/layout/AppShell';
import { useThemeStore } from '../../store/useThemeStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { musicApiService } from '../../services/api/musicApiService';
import { localMusicService, LocalFolderGroup } from '../../services/local/localMusicService';
import { cloudService } from '../../services/supabase/cloudService';
import { Playlist, Track } from '../../types/models';
import { hapticFeedback } from '../../utils/haptics';

const TABS = ['Playlists', 'Songs', 'Folders', 'Albums', 'Artists'];

export const LibraryScreen: React.FC = () => {
  const { colors } = useThemeStore();
  const { playTrack, currentTrack, playbackStatus, togglePlayPause } = usePlayerStore();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('Playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [folderGroups, setFolderGroups] = useState<LocalFolderGroup[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<LocalFolderGroup | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLibraryData() {
      try {
        const [cloudLikes, cloudPlaylists, trendingLists] = await Promise.all([
          cloudService.getLikedTracks(),
          cloudService.getUserPlaylists(),
          musicApiService.getTrendingPlaylists(),
        ]);

        if (isMounted) {
          if (cloudLikes && cloudLikes.length > 0) {
            setLikedTracks(cloudLikes);
          } else {
            // Fallback to initial discovery tracks
            const initialTracks = await musicApiService.getTrendingTracks(10);
            if (isMounted) setLikedTracks(initialTracks);
          }

          if (cloudPlaylists && cloudPlaylists.length > 0) {
            setPlaylists([...cloudPlaylists, ...trendingLists]);
          } else {
            setPlaylists(trendingLists);
          }
        }
      } catch (e) {
        console.warn('Library load error:', e);
      }
    }

    loadLibraryData();
    // Auto-scan local tracks
    scanLocalAudio();

    return () => {
      isMounted = false;
    };
  }, []);

  const scanLocalAudio = async (force = false) => {
    setIsScanning(true);
    try {
      const tracks = await localMusicService.scanLocalTracks(force);
      setLocalTracks(tracks);
      const groups = localMusicService.groupTracksByFolder(tracks);
      setFolderGroups(groups);
    } finally {
      setIsScanning(false);
    }
  };

  const isCurrentPlaying = (trackId: string) =>
    currentTrack?.id === trackId && playbackStatus === 'playing';

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header with Circular Glass Add Button */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Your Library</Text>
            <Text style={styles.headerSubtitle}>Playlists, liked tracks & downloads</Text>
          </View>

          <TouchableOpacity style={styles.glassCircleBtn} activeOpacity={0.8}>
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 2. Category Tab Pills (Semi-Transparent Glass) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
        >
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => {
                  hapticFeedback.selection();
                  setActiveTab(tab);
                }}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillSelected,
                ]}
              >
                <BlurView
                  intensity={isSelected ? 40 : 75}
                  tint="dark"
                  style={StyleSheet.absoluteFill}
                />
                <View
                  style={[
                    styles.glassWash,
                    isSelected && { backgroundColor: 'rgba(255, 255, 255, 0.16)' },
                  ]}
                />
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: '#FFFFFF',
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 3. Liked Songs & Downloads Glass Feature Cards */}
        <View style={styles.cardsBlock}>
          {/* Liked Songs Special Card */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              if (likedTracks.length > 0) playTrack(likedTracks[0], likedTracks);
            }}
            style={styles.featureGlassCard}
          >
            <BlurView intensity={75} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.glassWash} />

            <View style={[styles.cardIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}>
              <Heart size={20} color="#FFFFFF" fill="#FFFFFF" />
            </View>

            <View style={styles.cardMeta}>
              <Text style={styles.cardTitle}>Liked Songs</Text>
              <Text style={styles.cardSubtitle}>
                {likedTracks.length} tracks • auto-synced
              </Text>
            </View>
            <ChevronRight size={18} color="rgba(255, 255, 255, 0.45)" />
          </TouchableOpacity>

          {/* Downloads Card */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.featureGlassCard}
          >
            <BlurView intensity={75} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.glassWash} />

            <View style={[styles.cardIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <Download size={20} color="#FFFFFF" />
            </View>

            <View style={styles.cardMeta}>
              <Text style={styles.cardTitle}>Downloads</Text>
              <Text style={styles.cardSubtitle}>
                Available for offline playback
              </Text>
            </View>
            <ChevronRight size={18} color="rgba(255, 255, 255, 0.45)" />
          </TouchableOpacity>
        </View>

        {/* 4. Section Title with Scan Button */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'Playlists'
              ? 'My Playlists'
              : activeTab === 'Folders'
              ? selectedFolder
                ? selectedFolder.folderName
                : 'Device Folders'
              : activeTab === 'Songs'
              ? `All Songs (${likedTracks.length + localTracks.length})`
              : activeTab}
          </Text>

          {activeTab === 'Folders' && selectedFolder && (
            <TouchableOpacity onPress={() => setSelectedFolder(null)}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                ← All Folders
              </Text>
            </TouchableOpacity>
          )}

          {(activeTab === 'Folders' || activeTab === 'Songs') && !selectedFolder && (
            <TouchableOpacity
              onPress={() => scanLocalAudio(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                {isScanning ? 'Scanning...' : 'Rescan'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 5. Tab Content: Playlists / Folders / Songs */}
        {activeTab === 'Playlists' &&
          playlists.map((item, idx) => (
            <View key={`${item.id}-${idx}`}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('PlaylistDetails', { playlistId: item.id })}
                style={styles.trackRow}
              >
                <Image source={{ uri: item.coverUrl }} style={styles.coverImage} />

                <View style={styles.trackMetaWrap}>
                  <Text numberOfLines={1} style={styles.trackTitle}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.trackArtist}>
                    Playlist • {item.tracksCount || 24} songs
                  </Text>
                </View>

                <ChevronRight size={18} color="rgba(255, 255, 255, 0.45)" />
              </TouchableOpacity>
              <View style={styles.rowDivider} />
            </View>
          ))}

        {activeTab === 'Folders' && !selectedFolder && (
          folderGroups.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Folder size={44} color="rgba(255,255,255,0.25)" />
              <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 14 }}>
                {isScanning ? 'Scanning device storage...' : 'No music folders detected'}
              </Text>
              <TouchableOpacity
                onPress={() => scanLocalAudio(true)}
                style={{
                  marginTop: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Scan Device Storage</Text>
              </TouchableOpacity>
            </View>
          ) : (
            folderGroups.map((grp, idx) => (
              <View key={`${grp.folderPath}-${idx}`}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedFolder(grp)}
                  style={styles.trackRow}
                >
                  <View
                    style={[
                      styles.coverImage,
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 14,
                      },
                    ]}
                  >
                    <Folder size={26} color={colors.primary} />
                  </View>

                  <View style={styles.trackMetaWrap}>
                    <Text numberOfLines={1} style={styles.trackTitle}>
                      {grp.folderName}
                    </Text>
                    <Text numberOfLines={1} style={styles.trackArtist}>
                      {grp.tracks.length} local audio files
                    </Text>
                  </View>

                  <ChevronRight size={18} color="rgba(255, 255, 255, 0.45)" />
                </TouchableOpacity>
                <View style={styles.rowDivider} />
              </View>
            ))
          )
        )}

        {/* Songs Tab or Selected Folder View */}
        {(activeTab === 'Songs' || (activeTab === 'Folders' && selectedFolder)) && (
          (() => {
            const displayList = selectedFolder
              ? selectedFolder.tracks
              : [...localTracks, ...likedTracks];

            if (displayList.length === 0) {
              return (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                    No songs found. Tap 'Rescan' to detect local files.
                  </Text>
                </View>
              );
            }

            return displayList.map((track, idx) => {
              const isSelected = currentTrack?.id === track.id;
              const playing = isCurrentPlaying(track.id);

              return (
                <View key={`${track.id}-${idx}`}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => playTrack(track, displayList)}
                    style={styles.trackRow}
                  >
                    <Image source={{ uri: track.artworkUrl }} style={styles.coverImage} />

                    <View style={styles.trackMetaWrap}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.trackTitle,
                          isSelected && { color: colors.primary },
                        ]}
                      >
                        {track.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.trackArtist}>
                        {track.artist} • {track.album || 'Single'}
                      </Text>
                    </View>

                    <View style={styles.rowRightActions}>
                      <Text style={styles.durationText}>
                        {track.duration ? `${Math.floor(track.duration / 60)}:${String(Math.floor(track.duration % 60)).padStart(2, '0')}` : '03:15'}
                      </Text>
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => {
                          if (isSelected) {
                            togglePlayPause();
                          } else {
                            playTrack(track, displayList);
                          }
                        }}
                        style={styles.circlePlayPause}
                      >
                        {playing ? (
                          <Pause size={14} color="#FFFFFF" fill="#FFFFFF" />
                        ) : (
                          <Play size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.rowDivider} />
                </View>
              );
            });
          })()
        )}
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 170, // Independent scroll clearance above floating miniplayer
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  glassCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 10,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
  },
  categoryPillSelected: {
    borderColor: 'rgba(255, 255, 255, 0.65)',
  },
  categoryText: {
    fontSize: 13,
  },
  glassWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardsBlock: {
    gap: 10,
    marginBottom: 20,
  },
  featureGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardMeta: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 18,
  },
  coverImage: {
    width: 48,
    height: 48,
    borderRadius: 14,
    marginRight: 14,
  },
  trackMetaWrap: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  trackArtist: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  rowRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '500',
  },
  circlePlayPause: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: 68,
    marginRight: 6,
    marginVertical: 4,
  },
});
