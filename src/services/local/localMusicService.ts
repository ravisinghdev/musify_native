import * as MediaLibrary from 'expo-media-library/legacy';
import { Platform } from 'react-native';
import { Track } from '../../types/models';

export interface LocalFolderGroup {
  folderName: string;
  folderPath: string;
  tracks: Track[];
}

class LocalMusicService {
  private cachedTracks: Track[] = [];
  private hasScanned: boolean = false;

  /**
   * Request media library permissions cleanly across Android 13+ (READ_MEDIA_AUDIO)
   * and older Android releases (READ_EXTERNAL_STORAGE).
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
      if (status === 'granted') return true;

      if (canAskAgain) {
        const req = await MediaLibrary.requestPermissionsAsync();
        return req.status === 'granted';
      }
      return false;
    } catch (err) {
      console.warn('Error requesting media library permissions:', err);
      return false;
    }
  }

  /**
   * Scans all audio assets on device storage.
   * Filters out short recordings/ringtones (<20s).
   */
  async scanLocalTracks(forceRefresh = false): Promise<Track[]> {
    if (this.hasScanned && !forceRefresh && this.cachedTracks.length > 0) {
      return this.cachedTracks;
    }

    const hasPerm = await this.requestPermission();
    if (!hasPerm) {
      return [];
    }

    try {
      let allAssets: MediaLibrary.Asset[] = [];
      let after: string | undefined = undefined;
      let hasNextPage = true;

      // Page through local audio assets
      while (hasNextPage && allAssets.length < 1500) {
        const paged = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.audio,
          first: 200,
          after,
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        });

        allAssets = [...allAssets, ...paged.assets];
        hasNextPage = paged.hasNextPage;
        after = paged.endCursor;

        if (!hasNextPage || paged.assets.length === 0) break;
      }

      const tracks: Track[] = allAssets
        .filter((asset) => asset.duration >= 20) // exclude voice memos, notifications & sound bites
        .map((asset) => {
          // Parse title and artist from filename: e.g. "Artist - Song Title.mp3"
          let rawName = asset.filename.replace(/\.[^/.]+$/, '');
          let title = rawName;
          let artist = 'Local Artist';

          if (rawName.includes(' - ')) {
            const parts = rawName.split(' - ');
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
          }

          return {
            id: `local_${asset.id}`,
            title: title || 'Untitled Audio',
            artist: artist || 'Local Device Music',
            album: 'Device Storage',
            artworkUrl:
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
            mediaUrl: asset.uri,
            duration: Math.floor(asset.duration),
            type: 'audio',
            views: 0,
            likes: 0,
            isLiked: false,
          };
        });

      this.cachedTracks = tracks;
      this.hasScanned = true;
      return tracks;
    } catch (err) {
      console.warn('Failed to scan local audio files:', err);
      return [];
    }
  }

  /**
   * Group indexed tracks by folder
   */
  groupTracksByFolder(tracks: Track[]): LocalFolderGroup[] {
    const map = new Map<string, Track[]>();

    for (const track of tracks) {
      const uri = track.mediaUrl;
      const parts = uri.split('/');
      // Folder is the second-to-last path segment
      const folder = parts.length > 1 ? decodeURIComponent(parts[parts.length - 2]) : 'Music';

      if (!map.has(folder)) {
        map.set(folder, []);
      }
      map.get(folder)!.push(track);
    }

    return Array.from(map.entries()).map(([folderName, folderTracks]) => ({
      folderName,
      folderPath: folderName,
      tracks: folderTracks,
    }));
  }
}

export const localMusicService = new LocalMusicService();

