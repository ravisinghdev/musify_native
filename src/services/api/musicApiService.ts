import { Track, Playlist, Artist } from '../../types/models';

// Dedicated production Vercel backend
export const DEDICATED_BACKEND_URL: string = 'https://musifynative-server.vercel.app';

const SAAVN_BASE = 'https://saavn.bycomsolutions.com/api';
const SAAVN_FALLBACK = 'https://saavn.me/api';
const AUDIUS_BASE = 'https://api.audius.co/v1';
const ITUNES_BASE = 'https://itunes.apple.com';

class MusicApiService {
  private trendingTracksCache: Track[] | null = null;
  private trendingPlaylistsCache: Playlist[] | null = null;
  private searchCache: Map<string, Track[]> = new Map();

  /**
   * Safe fetch with timeout to prevent long delays
   */
  private async fetchWithTimeout(url: string, timeoutMs = 4500): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  /**
   * Search songs with ultra-fast multi-source fallback (JioSaavn -> iTunes India -> Audius)
   * Perfectly matches Hindi/Bollywood ("Arz Kiya Hai", "Aarzoo", "Kesariya") as well as global hits!
   */
  async searchTracks(query: string): Promise<Track[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const key = trimmed.toLowerCase();
    if (this.searchCache.has(key)) {
      return this.searchCache.get(key)!;
    }

    // 0. Dedicated HTTPS Backend (If configured with your Vercel URL)
    if (DEDICATED_BACKEND_URL) {
      try {
        const res = await this.fetchWithTimeout(`${DEDICATED_BACKEND_URL}/api/search?query=${encodeURIComponent(trimmed)}`, 4000);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.results) && json.results.length > 0) {
            this.searchCache.set(key, json.results);
            return json.results;
          }
        }
      } catch (e) {
        console.warn('Dedicated backend search error, falling back to public mirrors:', e);
      }
    }

    // 1. Primary: JioSaavn Live Catalog (Full 320kbps complete songs)
    try {
      let res = await this.fetchWithTimeout(`${SAAVN_BASE}/search/songs?query=${encodeURIComponent(trimmed)}&limit=25`, 3500);
      if (!res.ok) {
        res = await this.fetchWithTimeout(`${SAAVN_FALLBACK}/search/songs?query=${encodeURIComponent(trimmed)}&limit=25`, 3500);
      }
      if (res.ok) {
        const json = await res.json();
        const results = json.data?.results || [];
        if (Array.isArray(results) && results.length > 0) {
          const tracks = results.map((item: any) => this.formatSaavnTrack(item)).filter(Boolean) as Track[];
          if (tracks.length > 0) {
            this.searchCache.set(key, tracks);
            return tracks;
          }
        }
      }
    } catch (err) {
      // JioSaavn endpoint timed out or failed, try next provider
    }

    // 2. High-speed Fallback: Audius Search (Full length complete tracks)
    try {
      const url = `${AUDIUS_BASE}/tracks/search?query=${encodeURIComponent(trimmed)}&app_name=musify_native`;
      const res = await this.fetchWithTimeout(url, 3500);
      if (res.ok) {
        const json = await res.json();
        const rawTracks: any[] = json.data || [];
        const tracks = rawTracks.map((t) => this.formatAudiusTrack(t));
        if (tracks.length > 0) {
          this.searchCache.set(key, tracks);
          return tracks;
        }
      }
    } catch (err) {
      // Audius error
    }

    // 3. Fallback: Apple iTunes API
    try {
      const url = `${ITUNES_BASE}/search?term=${encodeURIComponent(trimmed)}&media=music&entity=song&country=in&limit=25`;
      const res = await this.fetchWithTimeout(url, 3500);
      if (res.ok) {
        const json = await res.json();
        const results = json.results || [];
        if (Array.isArray(results) && results.length > 0) {
          const tracks = results.map((item: any) => this.formatITunesTrack(item)).filter(Boolean) as Track[];
          if (tracks.length > 0) {
            this.searchCache.set(key, tracks);
            return tracks;
          }
        }
      }
    } catch (err) {
      // iTunes fallback error
    }

    return [];
  }

  /**
   * Get trending tracks (defaults to top Hindi & Global trending tracks)
   */
  async getTrendingTracks(limit = 30): Promise<Track[]> {
    if (this.trendingTracksCache && this.trendingTracksCache.length > 0) {
      return this.trendingTracksCache.slice(0, limit);
    }

    // 0. Dedicated HTTPS Backend (If configured with your Vercel URL)
    if (DEDICATED_BACKEND_URL) {
      try {
        const res = await this.fetchWithTimeout(`${DEDICATED_BACKEND_URL}/api/trending`, 4000);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.results) && json.results.length > 0) {
            this.trendingTracksCache = json.results;
            return json.results.slice(0, limit);
          }
        }
      } catch (e) {
        console.warn('Dedicated backend trending error, falling back to public mirrors:', e);
      }
    }

    // 1. Try JioSaavn top trending songs (Full-length high fidelity)
    try {
      let res = await this.fetchWithTimeout(`${SAAVN_BASE}/search/songs?query=hindi%20top%20hits&limit=30`, 4000);
      if (!res.ok) {
        res = await this.fetchWithTimeout(`${SAAVN_FALLBACK}/search/songs?query=hindi%20top%20hits&limit=30`, 4000);
      }
      if (res.ok) {
        const json = await res.json();
        const results = json.data?.results || [];
        if (Array.isArray(results) && results.length > 0) {
          const tracks = results.map((item: any) => this.formatSaavnTrack(item)).filter(Boolean) as Track[];
          if (tracks.length > 0) {
            this.trendingTracksCache = tracks;
            return tracks.slice(0, limit);
          }
        }
      }
    } catch (e) {}

    // 2. Try Audius trending (Full-length tracks)
    try {
      const url = `${AUDIUS_BASE}/tracks/trending?app_name=musify_native`;
      const res = await this.fetchWithTimeout(url, 3500);
      if (res.ok) {
        const json = await res.json();
        const rawTracks: any[] = json.data || [];
        const tracks = rawTracks.map((t) => this.formatAudiusTrack(t));
        if (tracks.length > 0) {
          this.trendingTracksCache = tracks;
          return tracks.slice(0, limit);
        }
      }
    } catch (e) {}

    // 3. Fallback to iTunes India
    try {
      const url = `${ITUNES_BASE}/search?term=Top+Hindi+Songs&media=music&entity=song&country=in&limit=30`;
      const res = await this.fetchWithTimeout(url, 3500);
      if (res.ok) {
        const json = await res.json();
        const results = json.results || [];
        if (Array.isArray(results) && results.length > 0) {
          const tracks = results.map((item: any) => this.formatITunesTrack(item)).filter(Boolean) as Track[];
          if (tracks.length > 0) {
            this.trendingTracksCache = tracks;
            return tracks.slice(0, limit);
          }
        }
      }
    } catch (e) {}

    return [];
  }

  /**
   * Get trending playlists
   */
  async getTrendingPlaylists(): Promise<Playlist[]> {
    if (this.trendingPlaylistsCache && this.trendingPlaylistsCache.length > 0) {
      return this.trendingPlaylistsCache;
    }

    try {
      const url = `${AUDIUS_BASE}/playlists/trending?app_name=musify_native`;
      const res = await this.fetchWithTimeout(url, 3500);
      if (res.ok) {
        const json = await res.json();
        const rawPlaylists: any[] = json.data || [];
        const playlists = rawPlaylists.slice(0, 10).map((p) => this.formatAudiusPlaylist(p));
        if (playlists.length > 0) {
          this.trendingPlaylistsCache = playlists;
          return playlists;
        }
      }
    } catch (e) {}

    return [];
  }

  /**
   * Get tracks for a playlist
   */
  async getPlaylistTracks(playlistId: string): Promise<Track[]> {
    try {
      const url = `${AUDIUS_BASE}/playlists/${playlistId}/tracks?app_name=musify_native`;
      const res = await this.fetchWithTimeout(url, 4000);
      if (res.ok) {
        const json = await res.json();
        const rawTracks: any[] = json.data || [];
        return rawTracks.map((t) => this.formatAudiusTrack(t));
      }
    } catch (e) {}
    return [];
  }

  /**
   * Derive featured artists from trending tracks
   */
  async getFeaturedArtists(): Promise<Artist[]> {
    const tracks = await this.getTrendingTracks(30);
    const artistsMap = new Map<string, Artist>();

    for (const track of tracks) {
      if (!artistsMap.has(track.artist)) {
        artistsMap.set(track.artist, {
          id: track.artistId || `artist_${track.id}`,
          name: track.artist,
          bio: `Verified artist streaming on Musify with top trending tracks worldwide.`,
          avatarUrl: track.artworkUrl,
          monthlyListeners: Math.floor((track.views || 50000) * 1.5),
          topTracks: [track],
          isFollowed: false,
        });
      }
    }

    return Array.from(artistsMap.values()).slice(0, 10);
  }

  /**
   * Formatters
   */
  private formatSaavnTrack(raw: any): Track | null {
    if (!raw) return null;

    // Pick best quality audio stream: 320kbps -> 160kbps -> 96kbps -> last
    let streamUrl = '';
    if (Array.isArray(raw.downloadUrl) && raw.downloadUrl.length > 0) {
      const highQ = raw.downloadUrl.find((u: any) => u.quality === '320kbps' || u.quality === '160kbps') || raw.downloadUrl[raw.downloadUrl.length - 1];
      streamUrl = highQ?.url || highQ?.link || '';
    } else if (raw.media_preview_url) {
      streamUrl = raw.media_preview_url;
    }

    if (!streamUrl) return null;

    // Enforce HTTPS across all audio streams so modern Android (Android 14, 15, 16+)
    // security policies never block or mute unencrypted cleartext HTTP media sockets!
    if (streamUrl.startsWith('http://')) {
      streamUrl = streamUrl.replace('http://', 'https://');
    }

    // Pick best image: 500x500 -> 150x150
    let artwork = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
    if (Array.isArray(raw.image)) {
      const bestImg = raw.image.find((i: any) => i.quality === '500x500' || i.quality === '150x150') || raw.image[raw.image.length - 1];
      artwork = bestImg?.url || bestImg?.link || artwork;
    } else if (typeof raw.image === 'string') {
      artwork = raw.image;
    }

    if (artwork.startsWith('http://')) {
      artwork = artwork.replace('http://', 'https://');
    }

    // Artist name extraction
    let artistName = 'Various Artists';
    if (raw.primaryArtists) {
      artistName = typeof raw.primaryArtists === 'string' ? raw.primaryArtists : raw.primaryArtists.map((a: any) => a.name).join(', ');
    } else if (raw.artist) {
      artistName = raw.artist;
    } else if (raw.singers) {
      artistName = raw.singers;
    }

    return {
      id: String(raw.id || raw.title),
      title: raw.name || raw.title || 'Untitled Track',
      artist: artistName,
      album: typeof raw.album === 'object' ? raw.album?.name || 'Single' : raw.album || 'Single',
      artworkUrl: artwork,
      mediaUrl: streamUrl,
      duration: Number(raw.duration) || 210,
      type: 'audio',
      views: Number(raw.playCount) || 75000,
      likes: Number(raw.favoriteCount) || 5400,
      isLiked: false,
    };
  }

  private formatITunesTrack(raw: any): Track | null {
    if (!raw || !raw.previewUrl) return null;

    // High-res artwork
    const artwork = raw.artworkUrl100
      ? raw.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
      : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';

    return {
      id: `itunes_${raw.trackId}`,
      title: raw.trackName || 'Untitled Track',
      artist: raw.artistName || 'Unknown Artist',
      artistId: String(raw.artistId || ''),
      album: raw.collectionName || 'Single',
      artworkUrl: artwork,
      mediaUrl: raw.previewUrl, // Direct high-speed CDN audio stream
      duration: Math.floor((raw.trackTimeMillis || 180000) / 1000),
      type: 'audio',
      views: 95000,
      likes: 8200,
      isLiked: false,
    };
  }

  private formatAudiusTrack(raw: any): Track {
    const artwork = raw.artwork
      ? raw.artwork['480x480'] || raw.artwork['150x150'] || Object.values(raw.artwork)[0]
      : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';

    const streamUrl = `${AUDIUS_BASE}/tracks/${raw.id}/stream?app_name=musify_native`;

    return {
      id: raw.id,
      title: raw.title || 'Untitled Track',
      artist: raw.user?.name || raw.user?.handle || 'Unknown Artist',
      artistId: raw.user?.id,
      album: raw.genre || 'Trending',
      artworkUrl: String(artwork),
      mediaUrl: streamUrl,
      duration: Number(raw.duration) || 180,
      type: 'audio',
      views: Number(raw.play_count) || 10000,
      likes: Number(raw.favorite_count) || 1200,
      isLiked: false,
    };
  }

  private formatAudiusPlaylist(raw: any, tracks: Track[] = []): Playlist {
    const cover = raw.artwork
      ? raw.artwork['480x480'] || raw.artwork['150x150'] || Object.values(raw.artwork)[0]
      : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';

    return {
      id: raw.id,
      title: raw.playlist_name || 'Featured Collection',
      description: raw.description || 'Curated high-fidelity music stream on Musify.',
      coverUrl: String(cover),
      tracksCount: Number(raw.track_count) || tracks.length || 10,
      curator: raw.user?.name || 'Musify Editorial',
      tracks,
    };
  }
}

export const musicApiService = new MusicApiService();
