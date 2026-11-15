import { Track } from '../../types/models';

/**
 * InnerTube API Client (based on tombulled/innertube specifications).
 * Directly interfaces with YouTube Music's internal InnerTube endpoints (`WEB_REMIX`).
 * Eliminates heavy node-only dependencies, ensuring lightning-fast search and browsing on React Native/Expo.
 */
class YouTubeService {
  private innerTubeBaseUrl = 'https://music.youtube.com/youtubei/v1';

  // Fallback public Invidious/Piped API mirrors for stream extraction and backup
  private apiMirrors = [
    'https://invidious.nerdvpn.de',
    'https://inv.tux.pizza',
    'https://yt.artemislena.eu',
    'https://invidious.protokolla.fi',
    'https://pipedapi.kavin.rocks',
  ];

  private currentMirrorIndex = 0;
  private searchCache: Map<string, Track[]> = new Map();
  private homeFeedCache: Track[] | null = null;
  private streamUrlCache: Map<string, { url: string; expiresAt: number }> = new Map();

  private getActiveMirrorUrl(): string {
    return this.apiMirrors[this.currentMirrorIndex];
  }

  private rotateMirror() {
    this.currentMirrorIndex = (this.currentMirrorIndex + 1) % this.apiMirrors.length;
  }

  /**
   * Search YouTube Music catalog using InnerTube WEB_REMIX client
   */
  async searchTracks(query: string): Promise<Track[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    if (this.searchCache.has(trimmed)) {
      return this.searchCache.get(trimmed)!;
    }

    try {
      // InnerTube search endpoint (music.youtube.com/youtubei/v1/search)
      const payload = {
        context: {
          client: {
            clientName: 'WEB_REMIX',
            clientVersion: '1.20240101.01.00',
            hl: 'en',
            gl: 'US',
          },
        },
        query: query.trim(),
      };

      const response = await fetch(`${this.innerTubeBaseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://music.youtube.com/',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const sectionList =
          data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

        const tracks: Track[] = [];

        for (const section of sectionList) {
          const renderers: any[] = [];
          if (section.itemSectionRenderer?.contents) {
            renderers.push(...section.itemSectionRenderer.contents);
          }
          if (section.musicShelfRenderer?.contents) {
            renderers.push(...section.musicShelfRenderer.contents);
          }

          for (const itemWrapper of renderers) {
            const item = itemWrapper.musicResponsiveListItemRenderer;
            if (!item) continue;

            const flexCols = item.flexColumns || [];
            const col0Runs = flexCols[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
            const title = col0Runs.map((r: any) => r.text).join('') || '';

            const col1Runs = flexCols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
            // In InnerTube Music: col1 often contains ['Song', ' • ', 'Artist Name', ' • ', 'Album']
            let artist = 'YouTube Music';
            let album = 'YouTube Music';
            if (col1Runs.length >= 3 && col1Runs[0]?.text === 'Song') {
              artist = col1Runs[2]?.text || 'YouTube Music';
              album = col1Runs[4]?.text || 'YouTube Music';
            } else if (col1Runs.length > 0) {
              artist = col1Runs[0]?.text || 'YouTube Music';
              album = col1Runs[2]?.text || 'YouTube Music';
            }

            const videoId =
              item.playlistItemData?.videoId ||
              col0Runs[0]?.navigationEndpoint?.watchEndpoint?.videoId ||
              item.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;

            if (videoId && title) {
              const thumbs = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
              const artworkUrl = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

              tracks.push({
                id: videoId,
                title,
                artist,
                album,
                artworkUrl,
                mediaUrl: '',
                duration: 210,
                type: title.toLowerCase().includes('video') ? 'video' : 'audio',
              });
            }
          }
        }

        if (tracks.length > 0) {
          this.searchCache.set(trimmed, tracks);
          return tracks;
        }
      }
    } catch (err) {
      console.warn('InnerTube search error, falling back to mirror:', err);
    }

    // Mirror fallback if direct InnerTube fails
    return this.searchTracksFromMirrors(query);
  }

  /**
   * Fetch trending/featured music from InnerTube FEmusic_home browse endpoint
   */
  async getHomeFeed(): Promise<Track[]> {
    if (this.homeFeedCache && this.homeFeedCache.length > 0) {
      return this.homeFeedCache;
    }

    try {
      const payload = {
        context: {
          client: {
            clientName: 'WEB_REMIX',
            clientVersion: '1.20240101.01.00',
            hl: 'en',
            gl: 'US',
          },
        },
        browseId: 'FEmusic_home',
      };

      const response = await fetch(`${this.innerTubeBaseUrl}/browse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://music.youtube.com/',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const sections =
          data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

        const feedTracks: Track[] = [];

        for (const s of sections) {
          const carousel = s.musicCarouselShelfRenderer;
          if (!carousel) continue;

          for (const item of carousel.contents || []) {
            const twoRow = item.musicTwoRowItemRenderer;
            const responsive = item.musicResponsiveListItemRenderer;

            if (twoRow) {
              const title = twoRow.title?.runs?.[0]?.text || '';
              const artist = twoRow.subtitle?.runs?.[0]?.text || 'YouTube Music';
              const videoId =
                twoRow.navigationEndpoint?.watchEndpoint?.videoId ||
                twoRow.thumbnailOverlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;
              const thumbs = twoRow.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
              const artworkUrl = thumbs[thumbs.length - 1]?.url || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

              if (videoId && title) {
                feedTracks.push({
                  id: videoId,
                  title,
                  artist,
                  album: 'Featured',
                  artworkUrl,
                  mediaUrl: '',
                  duration: 210,
                  type: 'audio',
                });
              }
            } else if (responsive) {
              const flexCols = responsive.flexColumns || [];
              const title = flexCols[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map((x: any) => x.text).join('') || '';
              const artist = flexCols[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || 'YouTube Music';
              const videoId = responsive.playlistItemData?.videoId;
              const thumbs = responsive.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
              const artworkUrl = thumbs[thumbs.length - 1]?.url || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

              if (videoId && title) {
                feedTracks.push({
                  id: videoId,
                  title,
                  artist,
                  album: 'Featured',
                  artworkUrl,
                  mediaUrl: '',
                  duration: 210,
                  type: 'audio',
                });
              }
            }
          }
        }

        if (feedTracks.length > 0) {
          this.homeFeedCache = feedTracks;
          return feedTracks;
        }
      }
    } catch (err) {
      console.warn('InnerTube home feed error:', err);
    }

    return [];
  }

  /**
   * Fallback search through Invidious / Piped mirror endpoints
   */
  private async searchTracksFromMirrors(query: string): Promise<Track[]> {
    for (let attempts = 0; attempts < 3; attempts++) {
      try {
        const baseUrl = this.getActiveMirrorUrl();
        const response = await fetch(`${baseUrl}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          this.rotateMirror();
          continue;
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          this.rotateMirror();
          continue;
        }

        const tracks: Track[] = data.slice(0, 25).map((item: any) => {
          const artworkUrl =
            item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

          return {
            id: item.videoId,
            title: item.title,
            artist: item.author || 'YouTube Artist',
            album: 'YouTube Music',
            artworkUrl,
            mediaUrl: '',
            duration: item.lengthSeconds || 210,
            type: item.title?.toLowerCase().includes('video') ? 'video' : 'audio',
            views: item.viewCount,
          };
        });

        return tracks;
      } catch {
        this.rotateMirror();
      }
    }

    return [];
  }

  /**
   * Resolve direct playable audio stream using Echo Music's exact client-side InnerTube logic:
   * 1. Query YouTube InnerTube Android/iOS/Embedded Client directly from mobile device (Residential/Cellular IP)
   * 2. Emergency fallback to fast Piped instances (kavin.rocks, piped.yt, leptons.xyz, adminforge.de)
   * 3. Select clean Opus/AAC stream URL
   */
  async getStreamUrl(videoId: string): Promise<string> {
    const cleanId = videoId.replace(/^yt_/, '');
    const cached = this.streamUrlCache.get(cleanId);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.url;
    }

    // 1. Direct Client-side InnerTube Player API with Android VR & TVHTML5 Client (Bypasses n-decipher & bot blocks)
    try {
      const innertubePayloads = [
        {
          context: {
            client: {
              clientName: 'ANDROID_VR',
              clientVersion: '1.65.10',
              deviceMake: 'Oculus',
              deviceModel: 'Quest 3',
              osName: 'Android',
              osVersion: '12L',
              hl: 'en',
              gl: 'US',
            },
          },
          videoId: cleanId,
        },
        {
          context: {
            client: {
              clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
              clientVersion: '2.0',
              hl: 'en',
              gl: 'US',
            },
            thirdParty: {
              embedUrl: 'https://www.youtube.com',
            },
          },
          videoId: cleanId,
        },
      ];

      for (const payload of innertubePayloads) {
        try {
          const res = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 14) gzip',
            },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            const data = await res.json();
            const formats = data?.streamingData?.adaptiveFormats || [];
            // Pick highest quality audio format (itag 251 Opus or itag 140 AAC)
            const audioFormats = formats.filter((f: any) => f.mimeType?.startsWith('audio/') && f.url);
            audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

            const bestUrl = audioFormats[0]?.url;
            if (bestUrl) {
              this.streamUrlCache.set(cleanId, { url: bestUrl, expiresAt: now + 5 * 3600 * 1000 });
              return bestUrl;
            }
          }
        } catch {
          // try next client
        }
      }
    } catch {
      // proceed to Piped fallback
    }

    // 2. Emergency Piped Instances Fallback (Identical to Echo Music v1.3+ 403 fallback)
    const pipedInstances = [
      'https://pipedapi.kavin.rocks',
      'https://api.piped.yt',
      'https://pipedapi.adminforge.de',
      'https://pipedapi.leptons.xyz',
    ];

    for (const base of pipedInstances) {
      try {
        const response = await fetch(`${base}/streams/${cleanId}`, {
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          const audio = data.audioStreams?.find((a: any) => a.format === 'M4A' || a.codec?.includes('mp4a') || a.mimeType?.includes('audio/mp4'))
            || data.audioStreams?.[0];

          if (audio?.url) {
            this.streamUrlCache.set(cleanId, { url: audio.url, expiresAt: now + 4 * 3600 * 1000 });
            return audio.url;
          }
        }
      } catch {
        continue;
      }
    }

    return '';
  }
}

export const youtubeService = new YouTubeService();

