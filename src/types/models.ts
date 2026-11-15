export type MediaType = 'audio' | 'video';

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  artworkUrl: string;
  mediaUrl: string;
  duration: number; // in seconds
  type: MediaType;
  views?: number;
  likes?: number;
  isLiked?: boolean;
  videoQuality?: string;
  lowQualityVideoUrl?: string;
  highQualityVideoUrl?: string;
  renderStreamUrl?: string;
  lyrics?: string[];
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tracksCount: number;
  curator: string;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  bannerUrl?: string;
  monthlyListeners: number;
  isFollowed?: boolean;
  topTracks: Track[];
  bio: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  releaseYear: number;
  coverUrl: string;
  tracks: Track[];
}

export type PlaybackStatus = 'idle' | 'buffering' | 'playing' | 'paused' | 'error';
export type RepeatMode = 'off' | 'all' | 'one';

