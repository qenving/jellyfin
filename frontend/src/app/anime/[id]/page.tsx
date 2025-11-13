'use client';

import React, { useState } from 'react';
import { use } from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { EpisodeList } from '@/components/anime/EpisodeList';
import { useAnimeDetail } from '@/hooks/useAnime';
import { formatRating, formatDate } from '@/lib/utils';
import api from '@/lib/api';

export default function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: anime, isLoading } = useAnimeDetail(resolvedParams.id);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = async () => {
    try {
      await api.put(`/anime/${resolvedParams.id}/favorite`, { isFavorite: !isFavorite });
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!anime) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Anime not found</h1>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const displayEpisodes = selectedSeasonId
    ? anime.episodes?.filter((ep) => ep.seasonNumber === anime.seasons?.find((s) => s.id === selectedSeasonId)?.seasonNumber)
    : anime.episodes;

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        {/* Hero/Header Section */}
        <div className="relative h-[50vh] md:h-[60vh]">
          {/* Backdrop Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${anime.backdropUrl || anime.posterUrl})`,
            }}
          />
          <div className="absolute inset-0 hero-gradient" />

          {/* Content */}
          <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
            <div className="flex items-end space-x-6">
              {/* Poster */}
              <div className="hidden md:block w-48 flex-shrink-0">
                <img
                  src={anime.posterUrl || '/placeholder-anime.jpg'}
                  alt={anime.name}
                  className="w-full rounded-lg shadow-2xl"
                />
              </div>

              {/* Info */}
              <div className="flex-1 pb-4">
                <h1 className="text-4xl md:text-6xl font-bold text-shadow-lg mb-4">
                  {anime.name}
                </h1>

                <div className="flex items-center space-x-4 text-shadow mb-4">
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
                  {anime.releaseYear && <span>{anime.releaseYear}</span>}
                  {anime.genres && anime.genres.length > 0 && (
                    <span>{anime.genres.join(' • ')}</span>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={toggleFavorite}
                    variant={isFavorite ? 'primary' : 'secondary'}
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill={isFavorite ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    {isFavorite ? 'In Watchlist' : 'Add to Watchlist'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
              {/* Overview */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <p className="text-white/80 leading-relaxed">
                  {anime.overview || 'No overview available.'}
                </p>
              </section>

              {/* Seasons (if any) */}
              {anime.seasons && anime.seasons.length > 1 && (
                <section>
                  <h2 className="text-2xl font-bold mb-4">Seasons</h2>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedSeasonId === null ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setSelectedSeasonId(null)}
                    >
                      All Episodes
                    </Button>
                    {anime.seasons.map((season) => (
                      <Button
                        key={season.id}
                        variant={selectedSeasonId === season.id ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setSelectedSeasonId(season.id)}
                      >
                        {season.name}
                      </Button>
                    ))}
                  </div>
                </section>
              )}

              {/* Episodes */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Episodes</h2>
                <EpisodeList episodes={displayEpisodes || []} />
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Info Card */}
              <div className="glass rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Information</h3>
                <div className="space-y-3">
                  {anime.studios && anime.studios.length > 0 && (
                    <div>
                      <p className="text-white/60 text-sm">Studio</p>
                      <p className="font-medium">{anime.studios.join(', ')}</p>
                    </div>
                  )}
                  {anime.premiereDate && (
                    <div>
                      <p className="text-white/60 text-sm">Premiere Date</p>
                      <p className="font-medium">{formatDate(anime.premiereDate)}</p>
                    </div>
                  )}
                  {anime.genres && anime.genres.length > 0 && (
                    <div>
                      <p className="text-white/60 text-sm">Genres</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {anime.genres.map((genre) => (
                          <span key={genre} className="badge">
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
