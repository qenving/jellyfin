import { Module } from '@nestjs/common';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { JellyfinModule } from '../jellyfin/jellyfin.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [JellyfinModule, PrismaModule],
  controllers: [WatchlistController],
  providers: [WatchlistService],
  exports: [WatchlistService],
})
export class WatchlistModule {}
