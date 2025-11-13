import React from 'react';
import Link from 'next/link';
import { Anime } from '@/types/anime';
import { Button } from '@/components/ui/Button';
import { formatRating, truncateText } from '@/lib/utils';

interface AnimeHeroProps {
  anime: Anime;
}

export function AnimeHero({ anime }: AnimeHeroProps) {
  return (
    <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${anime.backdropUrl || anime.posterUrl})`,
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 hero-gradient" />

      {/* Content */}
      <div className="relative container mx-auto px-4 h-full flex items-end pb-12 md:pb-20">
        <div className="max-w-3xl space-y-4 md:space-y-6">
          {/* Logo or Title */}
          {anime.logoUrl ? (
            <img
              src={anime.logoUrl}
              alt={anime.name}
              className="h-20 md:h-32 w-auto object-contain"
            />
          ) : (
            <h1 className="text-4xl md:text-6xl font-bold text-shadow-lg">
              {anime.name}
            </h1>
          )}

          {/* Meta Info */}
          <div className="flex items-center space-x-4 text-sm md:text-base text-shadow">
            {anime.rating && (
              <div className="flex items-center space-x-1">
                <svg
                  className="w-5 h-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold">{formatRating(anime.rating)}</span>
              </div>
            )}
            {anime.releaseYear && (
              <span className="font-semibold">{anime.releaseYear}</span>
            )}
            {anime.genres && anime.genres.length > 0 && (
              <span>{anime.genres.slice(0, 3).join(' • ')}</span>
            )}
          </div>

          {/* Overview */}
          {anime.overview && (
            <p className="text-base md:text-lg text-white/90 text-shadow max-w-2xl">
              {truncateText(anime.overview, 250)}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 pt-2">
            <Link href={`/anime/${anime.id}`}>
              <Button size="lg">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Watch Now
              </Button>
            </Link>

            <Link href={`/anime/${anime.id}`}>
              <Button variant="secondary" size="lg">
                More Info
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
