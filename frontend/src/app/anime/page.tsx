'use client';

import React, { useState } from 'react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AnimeGrid } from '@/components/anime/AnimeGrid';
import { AnimeHero } from '@/components/anime/AnimeHero';
import { useAnimeList, useContinueWatching } from '@/hooks/useAnime';
import { Input } from '@/components/ui/Input';

export default function AnimeCatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Name');
  const [sortOrder, setSortOrder] = useState<'Ascending' | 'Descending'>('Ascending');

  const { data: animeData, isLoading } = useAnimeList({
    search: searchQuery || undefined,
    sortBy,
    sortOrder,
    limit: 50,
  });

  const { data: continueWatching } = useContinueWatching(5);

  const featuredAnime = animeData?.items?.[0];

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        {/* Hero Section */}
        {featuredAnime && !searchQuery && (
          <AnimeHero anime={featuredAnime} />
        )}

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Continue Watching Section */}
          {continueWatching && continueWatching.length > 0 && !searchQuery && (
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6">Continue Watching</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {continueWatching.map((item: any) => (
                  <div key={item.id} className="glass rounded-lg p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{item.animeTitle}</h3>
                    <p className="text-sm text-white/60 mb-2">
                      EP {item.episodeNumber}: {item.episodeTitle}
                    </p>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(item.progressSeconds / item.durationSeconds) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="search"
                  placeholder="Search anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-anime"
                >
                  <option value="Name">Name</option>
                  <option value="PremiereDate">Release Date</option>
                  <option value="CommunityRating">Rating</option>
                  <option value="DateCreated">Recently Added</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="input-anime"
                >
                  <option value="Ascending">Ascending</option>
                  <option value="Descending">Descending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Anime Grid */}
          <section>
            <h2 className="text-3xl font-bold mb-6">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'All Anime'}
            </h2>
            <AnimeGrid
              animes={animeData?.items || []}
              isLoading={isLoading}
            />

            {/* Pagination could be added here */}
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
