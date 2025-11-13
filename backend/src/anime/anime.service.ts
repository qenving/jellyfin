import { Injectable, Logger } from '@nestjs/common';
import { JellyfinService } from '../jellyfin/jellyfin.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnimeListQueryDto, AnimeListResponseDto, AnimeItemDto } from './dto/anime-list.dto';
import { AnimeDetailDto, EpisodeDto, SeasonDto, UpdateProgressDto } from './dto/anime-detail.dto';
import { JellyfinItem } from '../common/interfaces/jellyfin.interface';

@Injectable()
export class AnimeService {
  private readonly logger = new Logger(AnimeService.name);

  constructor(
    private jellyfinService: JellyfinService,
    private prisma: PrismaService,
  ) {}

  async getAnimeList(
    userId: string,
    jellyfinUserId: string,
    jellyfinToken: string,
    query: AnimeListQueryDto,
  ): Promise<AnimeListResponseDto> {
    const startIndex = (query.page || 0) * (query.limit || 50);

    const response = await this.jellyfinService.getAnimeList(
      jellyfinUserId,
      jellyfinToken,
      {
        searchTerm: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        limit: query.limit,
        startIndex,
        genres: query.genres,
        years: query.years,
      },
    );

    const items: AnimeItemDto[] = response.Items.map((item) => this.mapToAnimeItem(item));

    return {
      items,
      total: response.TotalRecordCount,
      page: query.page || 0,
      limit: query.limit || 50,
    };
  }

  async getAnimeDetail(
    userId: string,
    animeId: string,
    jellyfinUserId: string,
    jellyfinToken: string,
  ): Promise<AnimeDetailDto> {
    // Get anime details
    const anime = await this.jellyfinService.getAnimeById(
      animeId,
      jellyfinUserId,
      jellyfinToken,
    );

    // Get seasons
    const seasons = await this.jellyfinService.getSeasons(
      animeId,
      jellyfinUserId,
      jellyfinToken,
    );

    // Get all episodes
    const episodes = await this.jellyfinService.getEpisodes(
      animeId,
      null,
      jellyfinUserId,
      jellyfinToken,
    );

    const detail: AnimeDetailDto = {
      id: anime.Id,
      name: anime.Name,
      overview: anime.Overview,
      rating: anime.CommunityRating,
      releaseYear: anime.ProductionYear,
      premiereDate: anime.PremiereDate,
      genres: anime.Genres,
      studios: anime.Studios?.map((s) => s.Name),
      posterUrl: anime.ImageTags?.Primary
        ? this.jellyfinService.getImageUrl(anime.Id, 'Primary')
        : null,
      backdropUrl: anime.BackdropImageTags?.length > 0
        ? this.jellyfinService.getImageUrl(anime.Id, 'Backdrop')
        : null,
      logoUrl: anime.ImageTags?.Logo
        ? this.jellyfinService.getImageUrl(anime.Id, 'Logo')
        : null,
      isFavorite: anime.UserData?.IsFavorite || false,
      playbackProgress: anime.UserData?.PlaybackPositionTicks
        ? this.ticksToSeconds(anime.UserData.PlaybackPositionTicks)
        : 0,
      isWatched: anime.UserData?.Played || false,
      runtime: anime.RunTimeTicks ? this.ticksToSeconds(anime.RunTimeTicks) : 0,
      seasons: seasons.map((season) => this.mapToSeason(season)),
      episodes: episodes.map((episode) => this.mapToEpisode(episode)),
    };

    return detail;
  }

  async getEpisodesBySeasonId(
    animeId: string,
    seasonId: string,
    jellyfinUserId: string,
    jellyfinToken: string,
  ): Promise<EpisodeDto[]> {
    const episodes = await this.jellyfinService.getEpisodes(
      animeId,
      seasonId,
      jellyfinUserId,
      jellyfinToken,
    );

    return episodes.map((episode) => this.mapToEpisode(episode));
  }

  async getStreamUrl(
    episodeId: string,
    jellyfinUserId: string,
    jellyfinToken: string,
  ): Promise<{ streamUrl: string; playbackInfo: any }> {
    const playbackInfo = await this.jellyfinService.getPlaybackInfo(
      episodeId,
      jellyfinUserId,
      jellyfinToken,
    );

    const streamUrl = this.jellyfinService.getStreamUrl(episodeId, jellyfinToken);

    return {
      streamUrl,
      playbackInfo,
    };
  }

  async updatePlaybackProgress(
    userId: string,
    jellyfinUserId: string,
    jellyfinToken: string,
    dto: UpdateProgressDto,
  ): Promise<void> {
    const positionTicks = this.secondsToTicks(dto.progressSeconds);

    // Update in Jellyfin
    await this.jellyfinService.updatePlaybackProgress(
      dto.episodeId,
      jellyfinUserId,
      jellyfinToken,
      positionTicks,
    );

    // Get episode details
    const episode = await this.jellyfinService.getAnimeById(
      dto.episodeId,
      jellyfinUserId,
      jellyfinToken,
    );

    // Update or create watch history in our database
    const completed = dto.progressSeconds >= dto.durationSeconds * 0.9; // Consider completed if watched 90%

    await this.prisma.watchHistory.upsert({
      where: {
        userId_episodeId: {
          userId,
          episodeId: dto.episodeId,
        },
      },
      update: {
        progressSeconds: dto.progressSeconds,
        durationSeconds: dto.durationSeconds,
        completed,
        updatedAt: new Date(),
      },
      create: {
        userId,
        episodeId: dto.episodeId,
        animeId: episode.SeriesId || episode.Id,
        progressSeconds: dto.progressSeconds,
        durationSeconds: dto.durationSeconds,
        completed,
        animeTitle: episode.SeriesName || episode.Name,
        episodeTitle: episode.Name,
        seasonNumber: episode.ParentIndexNumber,
        episodeNumber: episode.IndexNumber,
      },
    });

    // Mark as watched in Jellyfin if completed
    if (completed) {
      await this.jellyfinService.markAsWatched(
        dto.episodeId,
        jellyfinUserId,
        jellyfinToken,
      );
    }
  }

  async toggleFavorite(
    animeId: string,
    isFavorite: boolean,
    jellyfinUserId: string,
    jellyfinToken: string,
  ): Promise<void> {
    await this.jellyfinService.toggleFavorite(
      animeId,
      jellyfinUserId,
      jellyfinToken,
      isFavorite,
    );
  }

  async getWatchHistory(
    userId: string,
    limit: number = 20,
  ): Promise<any[]> {
    const history = await this.prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: 'desc' },
      take: limit,
    });

    return history;
  }

  async getContinueWatching(
    userId: string,
    limit: number = 10,
  ): Promise<any[]> {
    const continueWatching = await this.prisma.watchHistory.findMany({
      where: {
        userId,
        completed: false,
        progressSeconds: { gt: 0 },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return continueWatching;
  }

  // ============= HELPER METHODS =============

  private mapToAnimeItem(item: JellyfinItem): AnimeItemDto {
    return {
      id: item.Id,
      name: item.Name,
      overview: item.Overview,
      rating: item.CommunityRating,
      releaseYear: item.ProductionYear,
      premiereDate: item.PremiereDate,
      genres: item.Genres,
      posterUrl: item.ImageTags?.Primary
        ? this.jellyfinService.getImageUrl(item.Id, 'Primary')
        : null,
      backdropUrl: item.BackdropImageTags?.length > 0
        ? this.jellyfinService.getImageUrl(item.Id, 'Backdrop')
        : null,
      logoUrl: item.ImageTags?.Logo
        ? this.jellyfinService.getImageUrl(item.Id, 'Logo')
        : null,
      isFavorite: item.UserData?.IsFavorite || false,
      playbackProgress: item.UserData?.PlaybackPositionTicks
        ? this.ticksToSeconds(item.UserData.PlaybackPositionTicks)
        : 0,
      isWatched: item.UserData?.Played || false,
    };
  }

  private mapToSeason(season: JellyfinItem): SeasonDto {
    return {
      id: season.Id,
      name: season.Name,
      overview: season.Overview,
      seasonNumber: season.IndexNumber,
      posterUrl: season.ImageTags?.Primary
        ? this.jellyfinService.getImageUrl(season.Id, 'Primary')
        : null,
    };
  }

  private mapToEpisode(episode: JellyfinItem): EpisodeDto {
    return {
      id: episode.Id,
      name: episode.Name,
      overview: episode.Overview,
      episodeNumber: episode.IndexNumber,
      seasonNumber: episode.ParentIndexNumber,
      seriesName: episode.SeriesName,
      posterUrl: episode.ImageTags?.Primary
        ? this.jellyfinService.getImageUrl(episode.Id, 'Primary')
        : null,
      runtime: episode.RunTimeTicks ? this.ticksToSeconds(episode.RunTimeTicks) : 0,
      isWatched: episode.UserData?.Played || false,
      playbackProgress: episode.UserData?.PlaybackPositionTicks
        ? this.ticksToSeconds(episode.UserData.PlaybackPositionTicks)
        : 0,
    };
  }

  private ticksToSeconds(ticks: number): number {
    return Math.floor(ticks / 10000000);
  }

  private secondsToTicks(seconds: number): number {
    return seconds * 10000000;
  }
}
