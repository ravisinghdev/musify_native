import { Track } from '../../types/models';
import { decodeHtmlEntities } from '../../utils/textUtils';

interface SpotifyTokenCache {
  token: string;
  expiresAt: number;
}

/**
 * Spotify Unofficial Client Service:
 * Extracts anonymous web player tokens directly from Spotify's embed SSR state
 * and queries Spotify's public Web API (api.spotify.com/v1) for exact catalog metadata.
 */
class SpotifyService {
  private tokenCache: SpotifyTokenCache | null = null;
  private searchCache: Map<string, Track[]> = new Map();

  /**
   * Fetch an anonymous Spotify Web Player access token dynamically
   * from open.spotify.com/embed without requiring developer dashboard keys.
   */
  async getAnonymousToken(): Promise<string> {
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt > now + 60000) {
      return this.tokenCache.token;
    }

    try {
      const res = await fetch('https://open.spotify.com/embed/track/4PTG3Z6ehGkBFwjybzWkR8', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (res.ok) {
        const html = await res.text();
        const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
        if (match && match[1]) {
          const parsed = JSON.parse(match[1]);
          const session = parsed?.props?.pageProps?.state?.settings?.session;
          const token = session?.accessToken;
          const exp = session?.accessTokenExpirationTimestampMs || now + 3600000;

          if (token) {
            this.tokenCache = {
              token,
              expiresAt: exp,
            };
            return token;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to extract Spotify anonymous token from embed:', e);
    }

    return '';
  }

  /**
   * Search Spotify's official catalog using the anonymous token
   */
  async searchTracks(query: string, limit = 25): Promise<Track[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const key = trimmed.toLowerCase();
    if (this.searchCache.has(key)) {
      return this.searchCache.get(key)!;
    }

    try {
      const token = await this.getAnonymousToken();
      if (!token) return [];

      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        trimmed
      )}&type=track&limit=${limit}&market=IN`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.ok) {
        const json = await res.json();
        const items = json?.tracks?.items || [];
        const tracks: Track[] = items
          .map((item: any) => this.formatSpotifyTrack(item))
          .filter(Boolean);

        if (tracks.length > 0) {
          this.searchCache.set(key, tracks);
          return tracks;
        }
      }
    } catch (err) {
      console.warn('Spotify searchTracks error:', err);
    }

    return [];
  }

  /**
   * Format Spotify Track object to Musify internal Track model
   */
  formatSpotifyTrack(raw: any): Track | null {
    if (!raw || !raw.name) return null;

    const artistNames = Array.isArray(raw.artists)
      ? raw.artists.map((a: any) => a.name).filter(Boolean).join(', ')
      : 'Various Artists';

    const images = raw.album?.images || [];
    const bestImage = images[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';

    return {
      id: `sp_${raw.id}`,
      title: decodeHtmlEntities(raw.name),
      artist: decodeHtmlEntities(artistNames),
      album: decodeHtmlEntities(raw.album?.name || 'Single'),
      artworkUrl: bestImage,
      mediaUrl: raw.preview_url || '', // Spotify 30s preview CDN or resolved on-demand
      duration: Math.floor((raw.duration_ms || 210000) / 1000),
      type: 'audio',
      views: raw.popularity ? raw.popularity * 2000 : 80000,
      likes: raw.popularity ? raw.popularity * 150 : 6000,
      isLiked: false,
    };
  }
}

export const spotifyService = new SpotifyService();
