import React from 'react';
import Link from 'next/link';
import { Anime } from '@/types/anime';
import { Card, CardImage, CardContent } from '@/components/ui/Card';
import { formatRating, truncateText, getProgressPercentage } from '@/lib/utils';

interface AnimeCardProps {
  anime: Anime;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const progressPercentage = anime.playbackProgress && anime.runtime
    ? getProgressPercentage(anime.playbackProgress, anime.runtime)
    : 0;

  return (
    <Link href={`/anime/${anime.id}`}>
      <Card hoverable className="h-full">
        {/* Poster Image */}
        <CardImage
          src={anime.posterUrl || '/placeholder-anime.jpg'}
          alt={anime.name}
          className="aspect-[2/3]"
        />

        {/* Content */}
        <CardContent>
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {anime.name}
          </h3>

          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {anime.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="text-xs px-2 py-0.5 rounded-full bg-anime-purple/20 text-anime-purple-light"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Rating and Year */}
          <div className="flex items-center justify-between text-sm text-white/60 mb-2">
            {anime.rating && (
              <div className="flex items-center space-x-1">
                <svg
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{formatRating(anime.rating)}</span>
              </div>
            )}
            {anime.releaseYear && (
              <span>{anime.releaseYear}</span>
            )}
          </div>

          {/* Progress Bar */}
          {progressPercentage > 0 && progressPercentage < 100 && (
            <div className="mt-2">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-white/40 mt-1">
                {progressPercentage}% watched
              </p>
            </div>
          )}

          {/* Watched Badge */}
          {anime.isWatched && (
            <div className="mt-2">
              <span className="badge bg-green-500/20 text-green-400 border-green-500/30">
                Completed
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
