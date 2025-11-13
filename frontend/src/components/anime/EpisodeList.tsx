import React from 'react';
import Link from 'next/link';
import { Episode } from '@/types/anime';
import { formatDuration, getProgressPercentage } from '@/lib/utils';

interface EpisodeListProps {
  episodes: Episode[];
}

export function EpisodeList({ episodes }: EpisodeListProps) {
  if (episodes.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        No episodes available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {episodes.map((episode) => {
        const progressPercentage = episode.playbackProgress && episode.runtime
          ? getProgressPercentage(episode.playbackProgress, episode.runtime)
          : 0;

        return (
          <Link
            key={episode.id}
            href={`/watch/${episode.id}`}
            className="block group"
          >
            <div className="glass rounded-lg overflow-hidden hover:border-anime-purple/50 transition-all duration-300">
              <div className="flex">
                {/* Thumbnail */}
                <div className="relative w-40 md:w-48 flex-shrink-0">
                  <img
                    src={episode.posterUrl || '/placeholder-episode.jpg'}
                    alt={episode.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>

                  {/* Duration Badge */}
                  {episode.runtime && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs">
                      {formatDuration(episode.runtime)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-anime-purple transition-colors">
                          {episode.episodeNumber && `${episode.episodeNumber}. `}
                          {episode.name}
                        </h3>
                        {episode.seasonNumber && (
                          <p className="text-sm text-white/60">
                            Season {episode.seasonNumber}
                          </p>
                        )}
                      </div>

                      {episode.isWatched && (
                        <span className="badge bg-green-500/20 text-green-400 border-green-500/30 flex-shrink-0 ml-2">
                          Watched
                        </span>
                      )}
                    </div>

                    {episode.overview && (
                      <p className="text-sm text-white/70 line-clamp-2">
                        {episode.overview}
                      </p>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {progressPercentage > 0 && progressPercentage < 100 && (
                    <div className="mt-3">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
