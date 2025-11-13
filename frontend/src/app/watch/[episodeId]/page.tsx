'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { VideoPlayer } from '@/components/anime/VideoPlayer';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { StreamInfo, Episode } from '@/types/anime';

export default function WatchPage({ params }: { params: Promise<{ episodeId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStreamInfo();
  }, [resolvedParams.episodeId]);

  const loadStreamInfo = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<StreamInfo>(`/anime/stream/${resolvedParams.episodeId}`);
      setStreamInfo(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load video stream');
      console.error('Stream error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoEnded = () => {
    // Could implement auto-play next episode here
    console.log('Video ended');
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mb-4" />
            <p className="text-white/60">Loading video...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !streamInfo) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-2xl font-bold mb-4">Failed to Load Video</h1>
            <p className="text-white/60 mb-6">{error}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-anime-darker">
        <div className="container mx-auto px-4 py-8">
          {/* Video Player */}
          <div className="mb-8">
            <VideoPlayer
              streamUrl={streamInfo.streamUrl}
              episodeId={resolvedParams.episodeId}
              initialProgress={episode?.playbackProgress}
              onEnded={handleVideoEnded}
            />
          </div>

          {/* Episode Info */}
          {episode && (
            <div className="glass rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    {episode.episodeNumber && `Episode ${episode.episodeNumber}: `}
                    {episode.name}
                  </h1>
                  {episode.seriesName && (
                    <p className="text-white/60">{episode.seriesName}</p>
                  )}
                </div>
                <Button variant="secondary" onClick={() => router.back()}>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back
                </Button>
              </div>

              {episode.overview && (
                <p className="text-white/80">{episode.overview}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
