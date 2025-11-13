import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnimeService } from './anime.service';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { AnimeListQueryDto } from './dto/anime-list.dto';
import { UpdateProgressDto } from './dto/anime-detail.dto';

@Controller('anime')
export class AnimeController {
  constructor(private animeService: AnimeService) {}

  @Get()
  async getAnimeList(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: AnimeListQueryDto,
  ) {
    return this.animeService.getAnimeList(
      user.userId,
      user.jellyfinUserId,
      user.jellyfinToken,
      query,
    );
  }

  @Get('continue-watching')
  async getContinueWatching(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: number,
  ) {
    return this.animeService.getContinueWatching(user.userId, limit);
  }

  @Get('history')
  async getWatchHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: number,
  ) {
    return this.animeService.getWatchHistory(user.userId, limit);
  }

  @Get(':id')
  async getAnimeDetail(
    @Param('id') animeId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.animeService.getAnimeDetail(
      user.userId,
      animeId,
      user.jellyfinUserId,
      user.jellyfinToken,
    );
  }

  @Get(':animeId/seasons/:seasonId/episodes')
  async getEpisodesBySeason(
    @Param('animeId') animeId: string,
    @Param('seasonId') seasonId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.animeService.getEpisodesBySeasonId(
      animeId,
      seasonId,
      user.jellyfinUserId,
      user.jellyfinToken,
    );
  }

  @Get('stream/:episodeId')
  async getStreamUrl(
    @Param('episodeId') episodeId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.animeService.getStreamUrl(
      episodeId,
      user.jellyfinUserId,
      user.jellyfinToken,
    );
  }

  @Post('progress')
  @HttpCode(HttpStatus.OK)
  async updateProgress(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateProgressDto,
  ) {
    await this.animeService.updatePlaybackProgress(
      user.userId,
      user.jellyfinUserId,
      user.jellyfinToken,
      dto,
    );
    return { message: 'Progress updated' };
  }

  @Put(':animeId/favorite')
  @HttpCode(HttpStatus.OK)
  async toggleFavorite(
    @Param('animeId') animeId: string,
    @Body('isFavorite') isFavorite: boolean,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.animeService.toggleFavorite(
      animeId,
      isFavorite,
      user.jellyfinUserId,
      user.jellyfinToken,
    );
    return { message: 'Favorite status updated' };
  }
}
