import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Search,
  ChevronLeft,
  MoreHorizontal,
  Sparkles,
  Play,
  Pause,
  Settings,
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { AppShell } from '../../components/layout/AppShell';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useThemeStore } from '../../store/useThemeStore';
import { musicApiService } from '../../services/api/musicApiService';
import { aiMusicService, AI_SUGGESTED_PROMPTS } from '../../services/ai/aiMusicService';
import { Track } from '../../types/models';
import { hapticFeedback } from '../../utils/haptics';

export const SearchScreen: React.FC = () => {
  const { colors } = useThemeStore();
  const { playTrack, currentTrack, playbackStatus, togglePlayPause } = usePlayerStore();
  const [query, setQuery] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiMood, setAiMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Track[]>([]);
  const [dailyMix, setDailyMix] = useState<Track[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    musicApiService.getTrendingTracks(25).then((tracks) => {
      setDailyMix(tracks.slice(0, 4));
      if (!query.trim()) {
        setResults(tracks);
      }
    });
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      musicApiService.getTrendingTracks(25).then(setResults);
      setSuggestions([]);
      setLoading(false);
      setAiMood(null);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (isAIMode) {
          const aiRes = await aiMusicService.generatePlaylistFromPrompt(query);
          setResults(aiRes.tracks);
          setAiMood(aiRes.mood);
        } else {
          const [liveResults, suggs] = await Promise.all([
            musicApiService.searchTracks(query),
            musicApiService.getSearchSuggestions(query),
          ]);
          setResults(liveResults);
          setSuggestions(suggs);
          setAiMood(null);
        }
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setLoading(false);
      }
    }, isAIMode ? 500 : 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, isAIMode]);

  const handleApplyAIPrompt = async (promptText: string) => {
    hapticFeedback.medium();
    setIsAIMode(true);
    setQuery(promptText);
  };

  const isCurrentPlaying = (trackId: string) =>
    currentTrack?.id === trackId && playbackStatus === 'playing';

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header with Circular Glass Buttons */}
        <View style={styles.topNavRow}>
          <TouchableOpacity style={styles.glassCircleBtn} activeOpacity={0.8}>
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
            <ChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.glassCircleBtn} activeOpacity={0.8}>
            <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
            <MoreHorizontal size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 2. Page Title & Subtitle */}
        <View style={styles.heroTextSection}>
          <Text style={styles.pageTitle}>Discover</Text>
          <Text style={styles.pageSubtitle}>Explore new music and more</Text>
        </View>

        {/* 3. Search Bar with Embedded AI Mode Pill */}
        <View style={styles.searchBarWrapper}>
          <BlurView intensity={75} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.glassWash} />

          <Search size={18} color="rgba(255, 255, 255, 0.65)" style={styles.searchIcon} />
          <TextInput
            placeholder={
              isAIMode
                ? 'Describe your vibe (e.g. late night acoustic)...'
                : 'Search music, artists, podcasts...'
            }
            placeholderTextColor="rgba(255, 255, 255, 0.45)"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />

          {/* AI Mode Capsule Toggle Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              hapticFeedback.medium();
              setIsAIMode(!isAIMode);
            }}
            style={[
              styles.aiModePill,
              isAIMode && {
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
                borderColor: colors.primary,
                borderWidth: 1,
              },
            ]}
          >
            <Sparkles size={14} color={isAIMode ? colors.primary : '#FFFFFF'} />
            <Text style={styles.aiModeText}>{isAIMode ? 'AI ON' : 'AI Mode'}</Text>
          </TouchableOpacity>
        </View>

        {/* Autocomplete Suggestions from YouTube */}
        {!isAIMode && suggestions.length > 0 && query.trim().length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 14 }}
          >
            {suggestions.slice(0, 8).map((sugg, idx) => (
              <TouchableOpacity
                key={`sugg-${idx}`}
                activeOpacity={0.8}
                onPress={() => {
                  hapticFeedback.light();
                  setQuery(sugg);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 14,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                }}
              >
                <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '600' }}>
                  {sugg}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* AI Suggested Prompt Capsules (Visible when in AI Mode or when query is empty) */}
        {isAIMode && (
          <View style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Sparkles size={14} color={colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                AI Vibe Suggestions
              </Text>
              {aiMood && (
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.12)' }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary }}>{aiMood}</Text>
                </View>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {AI_SUGGESTED_PROMPTS.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.85}
                  onPress={() => handleApplyAIPrompt(item.label)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 18,
                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: item.color }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 4. Daily Mix Section with Multi-Cover Card (Semi-transparent Glass) */}
        <View style={styles.dailyMixCard}>
          <BlurView intensity={75} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.glassWash} />

          <View style={styles.dailyMixHeader}>
            <View>
              <Text style={styles.dailyMixTitle}>Daily Mix</Text>
              <Text style={styles.dailyMixSubtitle}>Your daily soundtrack.</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (dailyMix.length > 0) playTrack(dailyMix[0], dailyMix);
              }}
              style={styles.dailyPlayBtn}
            >
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>

          {/* 4 Album Covers Row */}
          <View style={styles.dailyCoversRow}>
            {dailyMix.slice(0, 4).map((item, idx) => (
              <TouchableOpacity
                key={`${item.id}-${idx}`}
                activeOpacity={0.85}
                onPress={() => playTrack(item, dailyMix)}
                style={styles.dailyThumbWrap}
              >
                <Image source={{ uri: item.artworkUrl }} style={styles.dailyThumb} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. New Releases Section List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>New Releases</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          results.slice(0, 15).map((track, idx) => {
            const playing = isCurrentPlaying(track.id);
            const isSelected = currentTrack?.id === track.id;

            return (
              <View key={`${track.id}-${idx}`}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => playTrack(track, results)}
                  style={styles.releaseRow}
                >
                  <Image source={{ uri: track.artworkUrl }} style={styles.trackArtwork} />

                  <View style={styles.trackMetaWrap}>
                    <Text numberOfLines={1} style={styles.trackTitle}>
                      {track.title}
                    </Text>
                    <Text numberOfLines={1} style={styles.trackArtist}>
                      {track.artist}
                    </Text>
                  </View>

                  {/* Duration & Playing Button */}
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
                          playTrack(track, results);
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

                {/* Subtle Translucent Liquid Divider Line */}
                <View style={styles.rowDivider} />
              </View>
            );
          })
        )}
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 170, // Leaves space so items can be scrolled past the floating miniplayer
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
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
  heroTextSection: {
    marginBottom: 18,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  searchBarWrapper: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 6,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  glassWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  aiModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  aiModeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dailyMixCard: {
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
    padding: 18,
    backgroundColor: 'transparent',
    marginBottom: 24,
  },
  dailyMixHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dailyMixTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  dailyMixSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  dailyPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyCoversRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dailyThumbWrap: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  dailyThumb: {
    width: '100%',
    height: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '600',
  },
  releaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 18,
    marginBottom: 4,
  },
  trackArtwork: {
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
