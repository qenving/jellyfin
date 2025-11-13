export class EpisodeDto {
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

export class SeasonDto {
  id: string;
  name: string;
  overview?: string;
  seasonNumber?: number;
  posterUrl?: string;
  episodeCount?: number;
}

export class AnimeDetailDto {
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
  seasons?: SeasonDto[];
  episodes?: EpisodeDto[];
  runtime?: number;
}

export class UpdateProgressDto {
  episodeId: string;
  progressSeconds: number;
  durationSeconds: number;
}
