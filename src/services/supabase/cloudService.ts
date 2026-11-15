import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, Playlist } from '../../types/models';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  isGuest: boolean;
}

const GUEST_ID_KEY = '@musify_guest_user_id';
const LOCAL_LIKED_TRACKS_KEY = '@musify_local_liked_tracks';
const LOCAL_PLAYLISTS_KEY = '@musify_local_playlists';

class SupabaseCloudService {
  private currentUser: UserProfile | null = null;

  /**
   * Initialize or retrieve the active user profile (authenticated user or persistent guest)
   */
  async getCurrentUser(): Promise<UserProfile> {
    if (this.currentUser) return this.currentUser;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        this.currentUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'Musify Listener',
          avatarUrl: session.user.user_metadata?.avatar_url,
          isGuest: false,
        };
        return this.currentUser;
      }
    } catch (e) {
      // offline
    }

    // Fallback: persistent guest profile
    let guestId = await AsyncStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await AsyncStorage.setItem(GUEST_ID_KEY, guestId);
    }

    this.currentUser = {
      id: guestId,
      email: '',
      name: 'Guest Listener',
      isGuest: true,
    };

    return this.currentUser;
  }

  /**
   * Sign In with Email & Password
   */
  async signIn(email: string, pass: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    if (data.user) {
      this.currentUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || 'Musify Listener',
        isGuest: false,
      };
    }
    return data;
  }

  /**
   * Sign Up with Email, Password & Name
   */
  async signUp(email: string, pass: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { name },
      },
    });
    if (error) throw error;
    if (data.user) {
      this.currentUser = {
        id: data.user.id,
        email: data.user.email || '',
        name,
        isGuest: false,
      };
    }
    return data;
  }

  /**
   * Resend verification email for signup
   */
  async resendSignupEmail(email: string) {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
    return data;
  }

  /**
   * Verify signup OTP token
   */
  async verifySignupOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    if (data.user) {
      this.currentUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || 'Musify Listener',
        isGuest: false,
      };
    }
    return data;
  }

  /**
   * Sign Out
   */
  async signOut() {
    this.currentUser = null;
    await supabase.auth.signOut();
  }

  /**
   * Request Password Reset OTP/Email
   */
  async resetPasswordForEmail(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  }

  /**
   * Verify Recovery OTP & set session
   */
  async verifyRecoveryOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });
    if (error) throw error;
    if (data.user) {
      this.currentUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || 'Musify Listener',
        isGuest: false,
      };
    }
    return data;
  }

  /**
   * Update User Password (after recovery or while authenticated)
   */
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  }

  /**
   * Send Passwordless Sign-In OTP to Email
   */
  async signInWithOtp(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    if (error) throw error;
    return data;
  }

  /**
   * Verify Email Sign-In OTP
   */
  async verifyEmailOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    if (data.user) {
      this.currentUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || 'Musify Listener',
        isGuest: false,
      };
    }
    return data;
  }

  // ==========================================
  // CLOUD SYNC: LIKED TRACKS
  // ==========================================

  async getLikedTracks(): Promise<Track[]> {
    const user = await this.getCurrentUser();

    // 1. If signed in, query Supabase cloud table
    if (!user.isGuest) {
      try {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('track_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const tracks = data.map((d: any) => d.track_data).filter(Boolean);
          // Update local cache
          await AsyncStorage.setItem(LOCAL_LIKED_TRACKS_KEY, JSON.stringify(tracks));
          return tracks;
        }
      } catch (e) {
        // Fall back to local storage
      }
    }

    // 2. Fallback: local AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(LOCAL_LIKED_TRACKS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    return [];
  }

  async toggleLikeTrack(track: Track): Promise<boolean> {
    const user = await this.getCurrentUser();
    const currentList = await this.getLikedTracks();
    const isAlreadyLiked = currentList.some((t) => t.id === track.id);
    let updatedList: Track[] = [];

    if (isAlreadyLiked) {
      updatedList = currentList.filter((t) => t.id !== track.id);
    } else {
      updatedList = [{ ...track, isLiked: true }, ...currentList];
    }

    // Cache locally immediately (zero-lag UI)
    await AsyncStorage.setItem(LOCAL_LIKED_TRACKS_KEY, JSON.stringify(updatedList));

    // Sync to Supabase cloud if authenticated
    if (!user.isGuest) {
      try {
        if (isAlreadyLiked) {
          await supabase
            .from('user_favorites')
            .delete()
            .match({ user_id: user.id, track_id: track.id });
        } else {
          await supabase.from('user_favorites').upsert({
            user_id: user.id,
            track_id: track.id,
            track_data: track,
            created_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn('Supabase favorite sync error (cached locally):', e);
      }
    }

    return !isAlreadyLiked;
  }

  // ==========================================
  // CLOUD SYNC: LISTENING HISTORY
  // ==========================================

  async logPlayHistory(track: Track) {
    const user = await this.getCurrentUser();
    if (user.isGuest) return;

    try {
      await supabase.from('user_history').insert({
        user_id: user.id,
        track_id: track.id,
        track_data: track,
        played_at: new Date().toISOString(),
      });
    } catch (e) {
      // ignore offline errors
    }
  }

  // ==========================================
  // CLOUD SYNC: PLAYLISTS
  // ==========================================

  async getUserPlaylists(): Promise<Playlist[]> {
    const user = await this.getCurrentUser();

    if (!user.isGuest) {
      try {
        const { data, error } = await supabase
          .from('user_playlists')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const list: Playlist[] = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            description: d.description || '',
            coverUrl: d.cover_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
            tracksCount: d.tracks ? d.tracks.length : 0,
            curator: user.name || 'You',
            tracks: d.tracks || [],
          }));
          await AsyncStorage.setItem(LOCAL_PLAYLISTS_KEY, JSON.stringify(list));
          return list;
        }
      } catch (e) {}
    }

    try {
      const stored = await AsyncStorage.getItem(LOCAL_PLAYLISTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    return [];
  }

  async createPlaylist(title: string, description = ''): Promise<Playlist> {
    const user = await this.getCurrentUser();
    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}`,
      title,
      description,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      tracksCount: 0,
      curator: user.name || 'You',
      tracks: [],
    };

    const current = await this.getUserPlaylists();
    const updated = [newPlaylist, ...current];
    await AsyncStorage.setItem(LOCAL_PLAYLISTS_KEY, JSON.stringify(updated));

    if (!user.isGuest) {
      try {
        await supabase.from('user_playlists').insert({
          id: newPlaylist.id,
          user_id: user.id,
          title: newPlaylist.title,
          description: newPlaylist.description,
          cover_url: newPlaylist.coverUrl,
          tracks: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (e) {}
    }

    return newPlaylist;
  }
}

export const cloudService = new SupabaseCloudService();

