import { Track, Playlist, Artist } from '../../types/models';
import { decodeHtmlEntities } from '../../utils/textUtils';
import { youtubeService } from '../youtube/youtubeService';
import { spotifyService } from '../spotify/spotifyService';

// Dedicated production backends
export const RENDER_BACKEND_URL: string = 'https://musify-native.onrender.com';
export const DEDICATED_BACKEND_URL: string = 'https://musify-native.onrender.com';

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
   * Search songs with intelligent high-accuracy catalog priority:
   * 1. YouTube Global InnerTube Search (Direct primary source - finds Pasoori, Alfaaz, Coke Studio & all official releases)
   * 2. Spotify Unofficial Catalog Search (Metadata & cover art enrichment)
   * 3. Audius global catalog
   */
  async searchTracks(query: string): Promise<Track[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const key = trimmed.toLowerCase();
    if (this.searchCache.has(key)) {
      return this.searchCache.get(key)!;
    }

    // 1. YouTube Global InnerTube Search (Primary - Exact match with verified YouTube video IDs!)
    try {
      const ytTracks = await youtubeService.searchTracks(trimmed);
      if (Array.isArray(ytTracks) && ytTracks.length > 0) {
        this.searchCache.set(key, ytTracks);
        return ytTracks;
      }
    } catch (e) {
      console.warn('YouTube InnerTube search failed, falling back:', e);
    }

    // 2. Spotify Unofficial Catalog Search fallback
    try {
      const spotifyTracks = await spotifyService.searchTracks(trimmed, 25);
      if (Array.isArray(spotifyTracks) && spotifyTracks.length > 0) {
        this.searchCache.set(key, spotifyTracks);
        return spotifyTracks;
      }
    } catch (e) {
      console.warn('Spotify catalog search error, falling back:', e);
    }

    // 3. Direct Render YouTube search fallback
    if (RENDER_BACKEND_URL) {
      try {
        const res = await this.fetchWithTimeout(
          `${RENDER_BACKEND_URL}/api/v1/search?q=${encodeURIComponent(trimmed)}&type=song`,
          4000
        );
        if (res.ok) {
          const json = await res.json();
          const rawTracks = json.tracks || json.data || json.results || [];
          if (Array.isArray(rawTracks) && rawTracks.length > 0) {
            const formatted = rawTracks.map((item: any) => this.formatRenderTrack(item)).filter(Boolean) as Track[];
            if (formatted.length > 0) {
              this.searchCache.set(key, formatted);
              return formatted;
            }
          }
        }
      } catch (err) {
        console.warn('Render search error:', err);
      }
    }

    // 4. Audius Search Fallback
    try {
      const url = `${AUDIUS_BASE}/tracks/search?query=${encodeURIComponent(trimmed)}&app_name=musify_native`;
      const res = await this.fetchWithTimeout(url, 3500);
      if (res.ok) {
        const json = await res.json();
        const rawTracks: any[] = json.data || [];
        const audiusTracks = rawTracks.map((t) => this.formatAudiusTrack(t)).filter((t) => t && t.mediaUrl) as Track[];
        if (audiusTracks.length > 0) {
          this.searchCache.set(key, audiusTracks);
          return audiusTracks;
        }
      }
    } catch {
      // ignore
    }

    return [];
  }

  /**
   * Resolve direct playable stream URL for a track using Client-Side YouTube Audio Extractor:
   * 1. If track is from Spotify (starts with sp_ or has title+artist), resolve stream via YouTube video ID
   * 2. If track has direct high-speed CDN audio (Audius / iTunes / preview), play directly.
   * 3. Fallback to direct client-side YouTube extraction or Render stream proxy.
   */
  async resolvePlayableStream(track: Track): Promise<string> {
    if (!track) return '';

    // Direct CDN preview or Audius stream
    if (track.mediaUrl && (track.mediaUrl.includes('audius.co') || track.mediaUrl.includes('apple.com'))) {
      return track.mediaUrl;
    }

    const cleanId = (track.id || '').replace(/^yt_/, '');

    // If it's a Spotify track (or missing direct stream), search YouTube directly for the exact original track
    if (track.id?.startsWith('sp_') || !track.mediaUrl) {
      try {
        const cleanTitle = (track.title || '')
          .replace(/\(.*?\)|\[.*?\]/g, '')
          .replace(/official\s+video|lyric\s+video|audio|remix|mashup/gi, '')
          .trim();
        const artist = (track.artist || '').split(',')[0].trim();
        const searchQuery = `${cleanTitle} ${artist}`.trim();

        const ytMatches = await youtubeService.searchTracks(searchQuery);
        if (Array.isArray(ytMatches) && ytMatches.length > 0) {
          // Reject mashups/remixes when matching a non-remix track
          const originalMatch = ytMatches.find((m) => {
            const mTitle = (m.title || '').toLowerCase();
            return !mTitle.includes('remix') && !mTitle.includes('mashup') && !mTitle.includes('relight');
          }) || ytMatches[0];

          if (originalMatch?.id) {
            const stream = await youtubeService.getStreamUrl(originalMatch.id);
            if (stream) return stream;
          }
        }
      } catch (err) {
        console.warn('Spotify to YouTube stream resolution error:', err);
      }
    }

    // Direct Client-side InnerTube Audio Extraction
    if (cleanId && cleanId.length === 11) {
      try {
        const clientStream = await youtubeService.getStreamUrl(cleanId);
        if (clientStream) {
          return clientStream;
        }
      } catch (err) {
        console.warn('Direct client-side YouTube stream extraction error:', err);
      }
    }

    // Fallback: Stream directly from YouTube via Render Proxy
    if (RENDER_BACKEND_URL && cleanId) {
      return `${RENDER_BACKEND_URL}/api/v1/tracks/${cleanId}/stream`;
    }

    return track.mediaUrl || '';
  }

  /**
   * Search suggestions (autocomplete) from Render YouTube search
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    const trimmed = query.trim();
    if (!trimmed || !RENDER_BACKEND_URL) return [];
    try {
      const res = await this.fetchWithTimeout(
        `${RENDER_BACKEND_URL}/api/v1/search/suggestions?q=${encodeURIComponent(trimmed)}`,
        2500
      );
      if (res.ok) {
        const json = await res.json();
        return Array.isArray(json) ? json : [];
      }
    } catch {
      // ignore
    }
    return [];
  }
  async getTrendingTracks(limit = 30): Promise<Track[]> {
    if (this.trendingTracksCache && this.trendingTracksCache.length > 0) {
      return this.trendingTracksCache.slice(0, limit);
    }

    // 1. Spotify Top Global & Regional Trending Hits
    try {
      const spotifyHits = await spotifyService.searchTracks('Top Hits 2026', limit);
      if (Array.isArray(spotifyHits) && spotifyHits.length > 0) {
        this.trendingTracksCache = spotifyHits;
        return spotifyHits.slice(0, limit);
      }
    } catch (e) {
      // ignore
    }

    // 2. Render Backend Recommendations fallback
    if (RENDER_BACKEND_URL) {
      try {
        const res = await this.fetchWithTimeout(`${RENDER_BACKEND_URL}/api/v1/search/recommendations`, 4000);
        if (res.ok) {
          const json = await res.json();
          const recTracks = json.recommendedTracks || json.tracks || json.results || [];
          if (Array.isArray(recTracks) && recTracks.length > 0) {
            const tracks = recTracks.map((item: any) => this.formatRenderTrack(item)).filter(Boolean) as Track[];
            if (tracks.length > 0) {
              this.trendingTracksCache = tracks;
              return tracks.slice(0, limit);
            }
          }
        }
      } catch (e) {
        // Fallback to next providers
      }
    }

    // 3. Try Audius trending (Full-length tracks)
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

    // 4. Fallback to iTunes
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
  private formatRenderTrack(raw: any): Track | null {
    if (!raw || !raw.title) return null;

    const sourceTrackId = raw.sourceTrackId || raw.id?.replace(/^yt_/, '') || '';
    const artistNames = Array.isArray(raw.artists)
      ? raw.artists.map((a: any) => (typeof a === 'string' ? a : a.name)).filter(Boolean).join(', ')
      : typeof raw.artists === 'string'
      ? raw.artists
      : raw.artist || 'Various Artists';

    const artwork = raw.artworkUrl || (sourceTrackId ? `https://i.ytimg.com/vi/${sourceTrackId}/hqdefault.jpg` : '');

    const baseRenderStream = `${RENDER_BACKEND_URL}/api/v1/tracks/${sourceTrackId}/stream`;

    return {
      id: raw.id || `yt_${sourceTrackId}`,
      title: decodeHtmlEntities(raw.title),
      artist: decodeHtmlEntities(artistNames || 'Various Artists'),
      artistId: raw.artists?.[0]?.id,
      album: decodeHtmlEntities(typeof raw.album === 'object' ? raw.album?.title || 'Single' : raw.album || 'Single'),
      artworkUrl: artwork,
      mediaUrl: baseRenderStream,
      lowQualityVideoUrl: `${baseRenderStream}?quality=low&video=true`,
      highQualityVideoUrl: `${baseRenderStream}?quality=high&video=true`,
      renderStreamUrl: baseRenderStream,
      duration: raw.durationMs ? Math.floor(raw.durationMs / 1000) : Number(raw.duration) || 210,
      type: 'audio',
      views: 85000,
      likes: 6400,
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
