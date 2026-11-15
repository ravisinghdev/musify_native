import { Track } from '../../types/models';
import { musicApiService } from '../api/musicApiService';

export interface AIPromptSuggestion {
  label: string;
  query: string;
  mood: string;
  color: string;
}

export const AI_SUGGESTED_PROMPTS: AIPromptSuggestion[] = [
  {
    label: 'Late Night Melancholy',
    query: 'acoustic sad slow indie songs',
    mood: 'Melancholic',
    color: '#00D2FF',
  },
  {
    label: 'Gym High-BPM Energy',
    query: 'workout high energy phonk edm',
    mood: 'Energetic',
    color: '#FA2D48',
  },
  {
    label: 'Deep Focus & Coding',
    query: 'lofi chill beats study ambient',
    mood: 'Focus',
    color: '#007AFF',
  },
  {
    label: 'Rainy Day Acoustic Warmth',
    query: 'coffee shop acoustic guitar vocals',
    mood: 'Cozy',
    color: '#FF9500',
  },
  {
    label: 'Bollywood Romantic Drive',
    query: 'romantic hindi hits arijit singh',
    mood: 'Romantic',
    color: '#FF2D88',
  },
  {
    label: 'Coke Studio Sufi Soul',
    query: 'coke studio ali sethi hamza malik sufi',
    mood: 'Spiritual',
    color: '#9D00FF',
  },
];

class AIMusicService {
  /**
   * Understand natural-language user prompts and extract musical descriptors
   * to query our streaming & local catalogs.
   */
  async generatePlaylistFromPrompt(prompt: string): Promise<{
    title: string;
    description: string;
    tracks: Track[];
    mood: string;
  }> {
    const clean = prompt.trim();
    if (!clean) {
      return {
        title: 'Daily Recommendations',
        description: 'Curated mix based on popular tracks.',
        tracks: await musicApiService.getTrendingTracks(15),
        mood: 'General',
      };
    }

    // Semantic keyword parsing for natural language
    let searchQuery = clean;
    let mood = 'Custom Mood';

    const lower = clean.toLowerCase();
    if (lower.includes('sad') || lower.includes('cry') || lower.includes('broken') || lower.includes('alone')) {
      searchQuery = `${clean} slow acoustic`;
      mood = 'Melancholic';
    } else if (lower.includes('workout') || lower.includes('gym') || lower.includes('running') || lower.includes('pump')) {
      searchQuery = `${clean} high bpm energetic`;
      mood = 'Energetic';
    } else if (lower.includes('study') || lower.includes('focus') || lower.includes('read') || lower.includes('code')) {
      searchQuery = `${clean} lofi chill instrumentals`;
      mood = 'Focus';
    } else if (lower.includes('party') || lower.includes('dance') || lower.includes('club')) {
      searchQuery = `${clean} club remix dance`;
      mood = 'Euphoric';
    } else if (lower.includes('sleep') || lower.includes('relax') || lower.includes('calm')) {
      searchQuery = `${clean} ambient peaceful calm`;
      mood = 'Peaceful';
    }

    // Query federated search engine with semantic enrichment
    const tracks = await musicApiService.searchTracks(searchQuery);

    return {
      title: clean.length > 28 ? `${clean.substring(0, 28)}...` : clean,
      description: `AI curated collection based on "${clean}" • ${mood}`,
      tracks: tracks.length > 0 ? tracks : await musicApiService.getTrendingTracks(15),
      mood,
    };
  }
}

export const aiMusicService = new AIMusicService();

