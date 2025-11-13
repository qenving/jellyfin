import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

export function useWatchProgress(episodeId: string) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateProgress = async (progressSeconds: number, durationSeconds: number) => {
    try {
      await api.post('/anime/progress', {
        episodeId,
        progressSeconds,
        durationSeconds,
      });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const startTracking = (currentTime: number, totalDuration: number) => {
    setProgress(currentTime);
    setDuration(totalDuration);

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Update progress every 30 seconds
    intervalRef.current = setInterval(() => {
      updateProgress(Math.floor(currentTime), Math.floor(totalDuration));
    }, 30000);
  };

  const stopTracking = (currentTime: number, totalDuration: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Final update
    updateProgress(Math.floor(currentTime), Math.floor(totalDuration));
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { progress, duration, startTracking, stopTracking, updateProgress };
}
