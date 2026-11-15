import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import path from "path";
import { YouTubeMusicProvider } from "./modules/youtube.provider";
import { AIService } from "./modules/ai.service";
import { memoryCache } from "./modules/cache.service";
import { roomService } from "./modules/room.service";
import type { TrackData } from "./modules/music.types";

const provider = new YouTubeMusicProvider();
const aiService = new AIService(provider);

const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "x-user-session-id"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      preflight: true,
    }),
  )
  .get("/api/health", () => ({
    status: "ok",
    service: "musify-api",
    timestamp: new Date().toISOString(),
  }))
  .get("/api/v1", () => ({
    name: "MUSIFY API",
    version: "1.0.0",
    endpoints: [
      "GET /api/v1/search?q=:query&type=all|song|artist|album|playlist",
      "GET /api/v1/search/recommendations",
      "GET /api/v1/search/suggestions?q=:query",
      "GET /api/v1/explore",
      "GET /api/v1/tracks/:id",
      "GET /api/v1/tracks/:id/playback",
      "GET /api/v1/tracks/:id/stream",
      "GET /api/v1/tracks/:id/queue",
      "GET /api/v1/tracks/:id/lyrics",
      "GET /api/v1/artists/:id",
      "GET /api/v1/albums/:id",
      "GET /api/v1/playlists/:id",
    ],
  }))

  // Multi-type Search with Ultra-Fast Concurrency Cache
  .get(
    "/api/v1/search",
    async ({ query }) => {
      const q = query.q?.trim() ?? "";
      if (!q) {
        return { tracks: [], artists: [], albums: [], playlists: [] };
      }

      const type = query.type ?? "song";
      const cacheKey = `search:${type}:${q}:${query.pageToken ?? ""}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) return cached;

      let result: any;
      switch (type) {
        case "artist":
          result = { artists: await provider.searchArtists(q) };
          break;
        case "album":
          result = { albums: await provider.searchAlbums(q) };
          break;
        case "playlist":
          result = { playlists: await provider.searchPlaylists(q) };
          break;
        case "all":
          result = await provider.searchAll(q);
          break;
        case "song":
        default:
          result = await provider.searchTracks(q, query.pageToken);
          break;
      }

      memoryCache.set(cacheKey, result, 900); // 15 min TTL
      return result;
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        type: t.Optional(
          t.Union([
            t.Literal("song"),
            t.Literal("artist"),
            t.Literal("album"),
            t.Literal("playlist"),
            t.Literal("all"),
          ]),
        ),
        pageToken: t.Optional(t.String()),
      }),
    },
  )

  // Search Recommendations (Trending, Categories, Top Picks) with Cache
  .get("/api/v1/search/recommendations", async () => {
    const cached = memoryCache.get("search_recommendations");
    if (cached) return cached;
    const recs = await provider.getSearchRecommendations();
    memoryCache.set("search_recommendations", recs, 600); // 10 min TTL
    return recs;
  })

  // Search Suggestions (Autocomplete) with Micro-Cache
  .get(
    "/api/v1/search/suggestions",
    async ({ query }) => {
      const q = query.q?.trim() ?? "";
      if (!q) return [];
      const cacheKey = `sugg:${q.toLowerCase()}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) return cached;
      const suggs = await provider.getSearchSuggestions(q);
      memoryCache.set(cacheKey, suggs, 1800); // 30 min TTL
      return suggs;
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
      }),
    },
  )

  // Explore & Home Feed with High-Traffic Cache
  .get("/api/v1/explore", async () => {
    const cached = memoryCache.get("explore_feed");
    if (cached) return cached;
    const feed = await provider.getExploreFeed();
    memoryCache.set("explore_feed", feed, 600); // 10 min TTL
    return feed;
  })

  // Server Cache & Concurrency Stats
  .get("/api/v1/server/stats", () => ({
    cache: memoryCache.getStats(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  }))

  // Listen Together & Remote Sync Rooms API
  .post(
    "/api/v1/rooms/create",
    async ({ body }) => {
      const code = `MUS-${Math.floor(100 + Math.random() * 900)}`;
      const state = roomService.createRoom(code, body.hostId, body.hostName);
      return { room: state, code };
    },
    {
      body: t.Object({
        hostId: t.String(),
        hostName: t.String(),
      }),
    },
  )
  .get("/api/v1/rooms/:code", async ({ params, set }) => {
    const room = roomService.getRoom(params.code);
    if (!room) {
      set.status = 404;
      return { error: "Room not found or expired" };
    }
    return { room: room.state };
  })

  // Real-time WebSocket Listen Together & MUSIFY Connect
  .ws("/ws/rooms/:roomId", {
    open(ws) {
      const roomId = (ws.data.params as any).roomId;
      const query = (ws.data as any).query || {};
      const memberId = query.memberId || `u_${Date.now()}`;
      const name = query.name || "Listener";
      const avatarUrl = query.avatarUrl;

      const state = roomService.joinRoom(roomId, { id: memberId, name, avatarUrl }, ws);
      ws.send(JSON.stringify({ type: "ROOM_CONNECTED", state, memberId }));
    },
    message(ws, message: any) {
      try {
        const payload = typeof message === "string" ? JSON.parse(message) : message;
        const roomId = (ws.data.params as any).roomId;
        const query = (ws.data as any).query || {};
        const memberId = query.memberId || "anon";

        if (payload.type === "ACTION") {
          roomService.syncPlayback(roomId, payload.action, memberId);
        } else if (payload.type === "CHAT") {
          roomService.broadcast(roomId, {
            type: "CHAT_MESSAGE",
            senderId: memberId,
            senderName: payload.name || "Listener",
            text: payload.text,
            timestamp: Date.now(),
          });
        }
      } catch {}
    },
    close(ws) {
      const roomId = (ws.data.params as any).roomId;
      const query = (ws.data as any).query || {};
      const memberId = query.memberId || "anon";
      roomService.leaveRoom(roomId, memberId);
    },
  })

  // Track Metadata
  .get(
    "/api/v1/tracks/:id",
    async ({ params, set }) => {
      const track = await provider.getTrack(params.id);
      if (!track) {
        set.status = 404;
        return { error: "Track not found" };
      }
      return track;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Track Audio Playback Stream URL
  .get(
    "/api/v1/tracks/:id/playback",
    async ({ params }) => {
      return await provider.getPlaybackBySourceId(params.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  // Direct Audio Streaming Proxy: Streams extracted audio bytes directly with HTTP Range Support
  .get(
    "/api/v1/tracks/:id/stream",
    async ({ params, request, set }) => {
      try {
        const cleanId = params.id.replace(/^yt_/, "");
        const playback = await provider.getPlaybackBySourceId(cleanId);
        if (!playback || !playback.playbackUrl) {
          set.status = 404;
          return { error: "Audio stream not found" };
        }

        const rangeHeader = request.headers.get("range");
        const headers: Record<string, string> = {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "*/*",
        };
        if (rangeHeader) {
          headers["Range"] = rangeHeader;
        }

        const audioRes = await fetch(playback.playbackUrl, { headers });
        if (!audioRes.ok && audioRes.status !== 206) {
          set.status = audioRes.status;
          return { error: "Upstream stream failed" };
        }

        set.status = audioRes.status;
        const contentType = audioRes.headers.get("content-type") || "audio/mp4";
        set.headers["content-type"] = contentType;
        set.headers["accept-ranges"] = "bytes";

        const contentRange = audioRes.headers.get("content-range");
        if (contentRange) {
          set.headers["content-range"] = contentRange;
        }
        const contentLength = audioRes.headers.get("content-length");
        if (contentLength) {
          set.headers["content-length"] = contentLength;
        }

        return new Response(audioRes.body, {
          status: audioRes.status,
          headers: set.headers as any,
        });
      } catch (err: any) {
        set.status = 500;
        return { error: err?.message || "Failed to stream audio" };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  // Alias for backward compatibility
  .get(
    "/api/v1/playback/:id",
    async ({ params }) => {
      return await provider.getPlaybackBySourceId(params.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Up Next / Autoplay Radio Queue
  .get(
    "/api/v1/tracks/:id/queue",
    async ({ params }) => {
      return await provider.getQueue(params.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Track Lyrics (Time-synced LRC via LRCLIB + YouTube fallback)
  .get(
    "/api/v1/tracks/:id/lyrics",
    async ({ params, query, set }) => {
      const lyrics = await provider.getLyrics(
        params.id,
        query.title,
        query.artist,
      );
      if (!lyrics) {
        set.status = 404;
        return { error: "Lyrics not available for this track" };
      }
      return lyrics;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        title: t.Optional(t.String()),
        artist: t.Optional(t.String()),
      }),
    },
  )

  // Artist Profile (Top songs, albums, singles)
  .get(
    "/api/v1/artists/:id",
    async ({ params, set }) => {
      const artist = await provider.getArtist(params.id);
      if (!artist) {
        set.status = 404;
        return { error: "Artist not found" };
      }
      return artist;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Album Details (Metadata + Tracklist)
  .get(
    "/api/v1/albums/:id",
    async ({ params, set }) => {
      const album = await provider.getAlbum(params.id);
      if (!album) {
        set.status = 404;
        return { error: "Album not found" };
      }
      return album;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Playlist Details (Metadata + Tracklist)
  .get(
    "/api/v1/playlists/:id",
    async ({ params, set }) => {
      const playlist = await provider.getPlaylist(params.id);
      if (!playlist) {
        set.status = 404;
        return { error: "Playlist not found" };
      }
      return playlist;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // AI Smart Playlist Generator
  .post(
    "/api/v1/ai/generate-playlist",
    async ({ body, set }) => {
      try {
        const result = await aiService.generatePlaylist(
          "guest",
          body.prompt,
          body.count ?? 8,
        );
        return result;
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Failed to generate AI playlist" };
      }
    },
    {
      body: t.Object({
        prompt: t.String(),
        count: t.Optional(t.Number()),
      }),
    },
  )

  // AI Next Song & Smart Queue Suggestions
  .get("/api/v1/ai/queue-suggestions", async () => {
    const mockTrack: TrackData = {
      id: "mock_curated",
      title: "Musify Spotlight",
      artists: [{ id: "artist_spotlight", name: "Featured" }],
      source: "youtube",
      sourceTrackId: "jfKfPfyJRdk",
    };
    const suggestions = await aiService.getAISmartQueueSuggestions(mockTrack, [], "smart", 6);
    return { suggestions };
  })
  .post(
    "/api/v1/ai/queue-suggestions",
    async ({ body, set }) => {
      try {
        const suggestions = await aiService.getAISmartQueueSuggestions(
          body.currentTrack as TrackData,
          (body.queue || []) as TrackData[],
          body.mood || "smart",
          body.count ?? 6,
        );
        return { suggestions };
      } catch (err: any) {
        set.status = 400;
        return { error: err.message || "Failed to generate AI queue suggestions" };
      }
    },
    {
      body: t.Object({
        currentTrack: t.Object({
          id: t.String(),
          title: t.String(),
          artists: t.Array(
            t.Object({
              id: t.String(),
              name: t.String(),
            }),
          ),
          album: t.Optional(
            t.Object({
              id: t.String(),
              title: t.String(),
            }),
          ),
          durationMs: t.Optional(t.Number()),
          artworkUrl: t.Optional(t.String()),
          sourceTrackId: t.String(),
        }),
        queue: t.Optional(
          t.Array(
            t.Object({
              id: t.String(),
              title: t.String(),
              artists: t.Array(
                t.Object({
                  id: t.String(),
                  name: t.String(),
                }),
              ),
              album: t.Optional(
                t.Object({
                  id: t.String(),
                  title: t.String(),
                }),
              ),
              durationMs: t.Optional(t.Number()),
              artworkUrl: t.Optional(t.String()),
              sourceTrackId: t.String(),
            }),
          ),
        ),
        mood: t.Optional(t.String()),
        count: t.Optional(t.Number()),
      }),
    },
  )

  // Fast track-based next AI recommendation
  .get(
    "/api/v1/tracks/:id/ai-suggestions",
    async ({ params, query }) => {
      const track = await provider.getTrack(params.id);
      if (!track) {
        return { suggestions: [] };
      }
      const count = query.count ? parseInt(query.count, 10) : 6;
      const suggestions = await aiService.getAISmartQueueSuggestions(
        track as TrackData,
        [],
        query.mood || "smart",
        count,
      );
      return { suggestions };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        count: t.Optional(t.String()),
        mood: t.Optional(t.String()),
      }),
    },
  )

  // Test endpoint
  .get("/api/test-video", async () => {
    return await provider.getPlaybackBySourceId("dQw4w9WgXcQ");
  })

  // Direct APK download endpoint for phone testing
  .get("/download/apk", ({ set }) => {
    try {
      const apkPath = path.resolve(process.cwd(), "releases", "Musify.apk");
      if (typeof Bun !== "undefined" && Bun.file) {
        const file = Bun.file(apkPath);
        if (file.size > 0) {
          return new Response(file, {
            headers: {
              "Content-Type": "application/vnd.android.package-archive",
              "Content-Disposition": 'attachment; filename="Musify.apk"',
            },
          });
        }
      }
    } catch {}
    set.redirect = "/downloads/Musify.apk";
  });

// Run standalone server on Render, Railway, Docker, or local Bun (unless executed inside Vercel serverless)
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 3001;
  const hostname = "0.0.0.0";
  app.listen({ port, hostname });
  console.log(`MUSIFY API is running on http://${hostname}:${port}`);
}

// Export a universal HTTP handler compatible with Vercel Node.js Serverless Functions, Bun & Edge
export default async function handler(req: any, res?: any) {
  if (req && res && typeof res.setHeader === "function") {
    try {
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
      const url = `${protocol}://${host}${req.url}`;

      let body: any = undefined;
      if (!["GET", "HEAD"].includes(req.method || "")) {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
        }
        if (chunks.length > 0) {
          body = Buffer.concat(chunks);
        }
      }

      const headers = new Headers();
      for (const [key, val] of Object.entries(req.headers)) {
        if (val !== undefined) {
          if (Array.isArray(val)) {
            val.forEach((v) => headers.append(key, v));
          } else {
            headers.set(key, val as string);
          }
        }
      }

      const webReq = new Request(url, {
        method: req.method,
        headers,
        body,
      });

      const webRes = await app.handle(webReq);

      res.statusCode = webRes.status;
      webRes.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      const resBuffer = await webRes.arrayBuffer();
      res.end(Buffer.from(resBuffer));
    } catch (err: any) {
      console.error("[Vercel Handler Error]:", err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err?.message || "Internal Server Error" }));
    }
    return;
  }

  return app.handle(req);
}

export { app };
export type App = typeof app;
