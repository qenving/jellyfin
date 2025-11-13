import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JellyfinService } from '../jellyfin/jellyfin.service';

@Injectable()
export class WatchlistService {
  constructor(
    private prisma: PrismaService,
    private jellyfinService: JellyfinService,
  ) {}

  async addToWatchlist(
    userId: string,
    animeId: string,
    jellyfinUserId: string,
    jellyfinToken: string,
  ) {
    // Get anime details from Jellyfin
    const anime = await this.jellyfinService.getAnimeById(
      animeId,
      jellyfinUserId,
      jellyfinToken,
    );

    // Add to watchlist
    const item = await this.prisma.watchlistItem.create({
      data: {
        userId,
        animeId,
        animeTitle: anime.Name,
        posterUrl: anime.ImageTags?.Primary
          ? this.jellyfinService.getImageUrl(anime.Id, 'Primary')
          : null,
      },
    });

    return item;
  }

  async removeFromWatchlist(userId: string, animeId: string) {
    const item = await this.prisma.watchlistItem.findFirst({
      where: { userId, animeId },
    });

    if (!item) {
      throw new NotFoundException('Item not found in watchlist');
    }

    await this.prisma.watchlistItem.delete({
      where: { id: item.id },
    });

    return { message: 'Removed from watchlist' };
  }

  async getWatchlist(userId: string) {
    const items = await this.prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
    });

    return items;
  }

  async isInWatchlist(userId: string, animeId: string): Promise<boolean> {
    const item = await this.prisma.watchlistItem.findFirst({
      where: { userId, animeId },
    });

    return !!item;
  }
}
