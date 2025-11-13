'use client';

import React, { useRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { useWatchProgress } from '@/hooks/useWatchProgress';

interface VideoPlayerProps {
  streamUrl: string;
  episodeId: string;
  initialProgress?: number;
  onEnded?: () => void;
}

export function VideoPlayer({
  streamUrl,
  episodeId,
  initialProgress = 0,
  onEnded,
}: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const { startTracking, stopTracking } = useWatchProgress(episodeId);

  useEffect(() => {
    // Seek to initial progress when ready
    if (playerRef.current && initialProgress > 0) {
      playerRef.current.seekTo(initialProgress, 'seconds');
    }
  }, [initialProgress]);

  const handlePlay = () => {
    setPlaying(true);
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      startTracking(currentTime, duration);
    }
  };

  const handlePause = () => {
    setPlaying(false);
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      stopTracking(currentTime, duration);
    }
  };

  const handleEnded = () => {
    if (playerRef.current) {
      stopTracking(duration, duration);
    }
    onEnded?.();
  };

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    // Progress updates happen here
    // We don't need to do anything as tracking is handled in intervals
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <ReactPlayer
        ref={playerRef}
        url={streamUrl}
        width="100%"
        height="100%"
        playing={playing}
        controls
        config={{
          file: {
            attributes: {
              controlsList: 'nodownload',
              crossOrigin: 'use-credentials',
            },
          },
        }}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onDuration={setDuration}
        onProgress={handleProgress}
      />
    </div>
  );
}
