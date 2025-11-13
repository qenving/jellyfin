import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JellyfinService } from './jellyfin.service';

@Module({
  imports: [ConfigModule],
  providers: [JellyfinService],
  exports: [JellyfinService],
})
export class JellyfinModule {}
