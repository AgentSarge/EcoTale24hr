import { useState, useEffect, useRef, DependencyList } from 'react';
import { monitoring } from '../lib/monitoring';

interface Cache {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

interface Options {
  cache?: Cache;
  dependencies?: DependencyList;
}

export function useDataFetch<T>(url: string, options: Options = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController>();

  useEffect(() => {
    const fetchData = async () => {
      // Check cache first
      if (options.cache) {
        const cachedData = options.cache.get(url) as T;
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }

      // Start performance monitoring
      const transaction = monitoring.startPerformanceTransaction(
        'data-fetch',
        'http.request'
      );

      try {
        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        const response = await fetch(url, { signal });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);

        // Cache the result if cache is available
        if (options.cache) {
          options.cache.set(url, result);
        }

        monitoring.setTag('data_fetch_success', url);
      } catch (err) {
        const error = err as Error;
        setError(error);
        monitoring.captureException(error, {
          url,
          component: 'useDataFetch',
        });
      } finally {
        setLoading(false);
        transaction.finish();
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, ...(options.dependencies || [])]);

  return { data, loading, error };
} 