import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Search, X, Video, Disc3, Sparkles } from 'lucide-react-native';
import { AppShell } from '../../components/layout/AppShell';
import { useThemeStore } from '../../store/useThemeStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { musicApiService } from '../../services/api/musicApiService';
import { Track } from '../../types/models';

export const SearchScreen: React.FC = () => {
  const { colors } = useThemeStore();
  const { playTrack, currentTrack } = usePlayerStore();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Track[]>([]);
  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    // Initially load trending tracks on search screen
    musicApiService.getTrendingTracks(20).then((tracks) => {
      if (!query.trim()) {
        setResults(tracks);
      }
    });
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      musicApiService.getTrendingTracks(20).then(setResults);
      setLoading(false);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const liveResults = await musicApiService.searchTracks(query);
        setResults(liveResults);
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  return (
    <AppShell>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Search</Text>
          <View style={[styles.ytBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
            <Sparkles size={13} color={colors.primary} />
            <Text style={[styles.ytBadgeText, { color: colors.textSecondary }]}>YT.js Powered</Text>
          </View>
        </View>

        {/* Search Bar Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
          <Search size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search any song, artist, album on YouTube..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            style={[styles.input, { color: colors.textPrimary }]}
          />
          {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />}
          {query.length > 0 && !loading && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Results List */}
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }: { item: Track }) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <TouchableOpacity
                onPress={() => playTrack(item, results)}
                style={[
                  styles.trackItem,
                  {
                    backgroundColor: isCurrent ? colors.surfaceElevated : 'transparent',
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <Image source={{ uri: item.artworkUrl }} style={styles.artwork} />
                <View style={styles.trackDetails}>
                  <Text numberOfLines={1} style={[styles.trackTitle, { color: isCurrent ? colors.primary : colors.textPrimary }]}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={[styles.trackSubtitle, { color: colors.textSecondary }]}>
                    {item.artist} • {item.album || 'YouTube'}
                  </Text>
                </View>
                {item.type === 'video' ? (
                  <Video size={18} color={colors.primary} />
                ) : (
                  <Disc3 size={18} color={isCurrent ? colors.primary : colors.textMuted} />
                )}
              </TouchableOpacity>
            );
          }}
        />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ytBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  ytBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  listContainer: {
    paddingBottom: 24,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 8,
  },
  artwork: {
    width: 46,
    height: 46,
    borderRadius: 8,
    marginRight: 12,
  },
  trackDetails: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  trackSubtitle: {
    fontSize: 12,
  },
});

