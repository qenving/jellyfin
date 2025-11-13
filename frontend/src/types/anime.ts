export interface Anime {
  id: string;
  name: string;
  overview?: string;
  rating?: number;
  releaseYear?: number;
  premiereDate?: string;
  genres?: string[];
  studios?: string[];
  posterUrl?: string;
  backdropUrl?: string;
  logoUrl?: string;
  isFavorite?: boolean;
  playbackProgress?: number;
  isWatched?: boolean;
  runtime?: number;
}

export interface AnimeDetail extends Anime {
  seasons?: Season[];
  episodes?: Episode[];
}

export interface Season {
  id: string;
  name: string;
  overview?: string;
  seasonNumber?: number;
  posterUrl?: string;
  episodeCount?: number;
}

export interface Episode {
  id: string;
  name: string;
  overview?: string;
  episodeNumber?: number;
  seasonNumber?: number;
  seriesName?: string;
  posterUrl?: string;
  runtime?: number;
  isWatched?: boolean;
  playbackProgress?: number;
}

export interface AnimeListResponse {
  items: Anime[];
  total: number;
  page: number;
  limit: number;
}

export interface StreamInfo {
  streamUrl: string;
  playbackInfo: any;
}

export interface WatchHistoryItem {
  id: string;
  episodeId: string;
  animeId: string;
  animeTitle: string;
  episodeTitle: string;
  seasonNumber?: number;
  episodeNumber?: number;
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
  watchedAt: string;
  updatedAt: string;
}

export interface WatchlistItem {
  id: string;
  animeId: string;
  animeTitle: string;
  posterUrl?: string;
  addedAt: string;
}
