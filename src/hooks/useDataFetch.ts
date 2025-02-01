import { useState, useEffect } from 'react';
import { cache } from '@/lib/cache';
import { monitoring } from '@/lib/monitoring';

interface FetchOptions {
  cacheTTL?: number;
  revalidate?: boolean;
  dependencies?: any[];
}

export function useDataFetch<T>(
  url: string,
  options: FetchOptions = {}
): {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const {
    cacheTTL = 5 * 60 * 1000, // 5 minutes default TTL
    revalidate = false,
    dependencies = [],
  } = options;

  const fetchData = async (skipCache: boolean = false): Promise<void> => {
    const cacheKey = `fetch:${url}`;
    
    if (!skipCache) {
      const cachedData = cache.get<T>(cacheKey);
      if (cachedData) {
        setData(cachedData);
        setIsLoading(false);
        return;
      }
    }

    try {
      setIsLoading(true);
      const transaction = monitoring.startPerformanceTransaction(
        'fetch',
        `GET ${url}`
      );

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      
      transaction.finish();

      setData(jsonData);
      cache.set(cacheKey, jsonData, cacheTTL);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      monitoring.captureException(error, { url });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(revalidate);
  }, [url, revalidate, ...dependencies]);

  const refetch = () => fetchData(true);

  return { data, error, isLoading, refetch };
} 