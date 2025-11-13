import { Module } from '@nestjs/common';
import { AnimeController } from './anime.controller';
import { AnimeService } from './anime.service';
import { JellyfinModule } from '../jellyfin/jellyfin.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [JellyfinModule, PrismaModule],
  controllers: [AnimeController],
  providers: [AnimeService],
  exports: [AnimeService],
})
export class AnimeModule {}
