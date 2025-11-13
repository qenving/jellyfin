import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('watchlist')
export class WatchlistController {
  constructor(private watchlistService: WatchlistService) {}

  @Get()
  async getWatchlist(@CurrentUser() user: CurrentUserPayload) {
    return this.watchlistService.getWatchlist(user.userId);
  }

  @Get('check/:animeId')
  async checkWatchlist(
    @Param('animeId') animeId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const isInWatchlist = await this.watchlistService.isInWatchlist(user.userId, animeId);
    return { isInWatchlist };
  }

  @Post(':animeId')
  @HttpCode(HttpStatus.CREATED)
  async addToWatchlist(
    @Param('animeId') animeId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.watchlistService.addToWatchlist(
      user.userId,
      animeId,
      user.jellyfinUserId,
      user.jellyfinToken,
    );
  }

  @Delete(':animeId')
  @HttpCode(HttpStatus.OK)
  async removeFromWatchlist(
    @Param('animeId') animeId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.watchlistService.removeFromWatchlist(user.userId, animeId);
  }
}
