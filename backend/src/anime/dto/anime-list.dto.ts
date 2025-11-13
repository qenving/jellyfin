import { IsOptional, IsString, IsNumber, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AnimeListQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'Ascending' | 'Descending';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  page?: number = 0;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  years?: number[];
}

export class AnimeItemDto {
  id: string;
  name: string;
  overview?: string;
  rating?: number;
  releaseYear?: number;
  premiereDate?: string;
  genres?: string[];
  posterUrl?: string;
  backdropUrl?: string;
  logoUrl?: string;
  isFavorite?: boolean;
  playbackProgress?: number;
  isWatched?: boolean;
}

export class AnimeListResponseDto {
  items: AnimeItemDto[];
  total: number;
  page: number;
  limit: number;
}
