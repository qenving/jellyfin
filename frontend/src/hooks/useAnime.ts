import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Anime, AnimeDetail, AnimeListResponse } from '@/types/anime';
import { AnimeQueryParams } from '@/types/api';

export function useAnimeList(params?: AnimeQueryParams) {
  const [data, setData] = useState<AnimeListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchAnimeList();
  }, [JSON.stringify(params)]);

  const fetchAnimeList = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<AnimeListResponse>('/anime', { params });
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refetch: fetchAnimeList };
}

export function useAnimeDetail(animeId: string | null) {
  const [data, setData] = useState<AnimeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (animeId) {
      fetchAnimeDetail();
    }
  }, [animeId]);

  const fetchAnimeDetail = async () => {
    if (!animeId) return;

    try {
      setIsLoading(true);
      const response = await api.get<AnimeDetail>(`/anime/${animeId}`);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refetch: fetchAnimeDetail };
}

export function useContinueWatching(limit: number = 10) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchContinueWatching();
  }, [limit]);

  const fetchContinueWatching = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/anime/continue-watching', {
        params: { limit },
      });
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, refetch: fetchContinueWatching };
}
