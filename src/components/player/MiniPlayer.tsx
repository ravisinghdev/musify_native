import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Play, Pause, SkipForward, Maximize2, Music } from 'lucide-react-native';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useThemeStore } from '../../store/useThemeStore';
import { RootStackParamList } from '../../navigation/types';

export const MiniPlayer: React.FC = () => {
  const { currentTrack, playbackStatus, togglePlayPause, nextTrack, position, duration } = usePlayerStore();
  const { colors } = useThemeStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!currentTrack) {
    return null;
  }

  const isPlaying = playbackStatus === 'playing';
  const progressRatio = duration > 0 ? Math.min(position / duration, 1) : 0;

  const handleOpenFullPlayer = () => {
    if (currentTrack.type === 'video') {
      navigation.navigate('VideoPlayerScreen', { trackId: currentTrack.id });
    } else {
      navigation.navigate('FullPlayerModal');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder }]}>
      {/* Micro Progress Bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressRatio * 100}%`, backgroundColor: colors.primary }]} />
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleOpenFullPlayer}
        style={styles.contentRow}
      >
        {/* Artwork */}
        <View style={styles.artContainer}>
          {currentTrack.artworkUrl ? (
            <Image source={{ uri: currentTrack.artworkUrl }} style={styles.artwork} />
          ) : (
            <View style={[styles.artworkFallback, { backgroundColor: colors.surfaceBorder }]}>
              <Music size={18} color={colors.textSecondary} />
            </View>
          )}
          {currentTrack.type === 'video' && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>VIDEO</Text>
            </View>
          )}
        </View>

        {/* Track Metadata */}
        <View style={styles.metaContainer}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.textPrimary }]}>
            {currentTrack.title}
          </Text>
          <Text numberOfLines={1} style={[styles.artist, { color: colors.textSecondary }]}>
            {currentTrack.artist}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={togglePlayPause}
            style={[styles.playButton, { backgroundColor: colors.primary }]}
          >
            {isPlaying ? (
              <Pause size={18} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={nextTrack}
            style={styles.iconButton}
          >
            <SkipForward size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleOpenFullPlayer}
            style={styles.iconButton}
          >
            <Maximize2 size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    borderTopWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarFill: {
    height: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  artContainer: {
    position: 'relative',
    marginRight: 12,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  artworkFallback: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  metaContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  artist: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    padding: 4,
  },
});

