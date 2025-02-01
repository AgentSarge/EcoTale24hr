import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { RecyclingData } from '../lib/supabase';
import * as Sentry from '@sentry/react';

interface UseRecyclingDataOptions {
  orderBy?: 'created_at' | 'weight_kg' | 'co2_saved_kg';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
}

interface RecyclingDataState {
  data: RecyclingData[];
  isLoading: boolean;
  error: string | null;
  totalRecycled: number;
  totalCO2Saved: number;
  refetch: () => Promise<void>;
}

export const useRecyclingData = (options: UseRecyclingDataOptions = {}): RecyclingDataState => {
  const [data, setData] = useState<RecyclingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    orderBy = 'created_at',
    orderDirection = 'asc',
    limit,
  } = options;

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('recycling_data')
        .select('*')
        .order(orderBy, { ascending: orderDirection === 'asc' });

      if (limit) {
        query = query.limit(limit);
      }

      const { data: recyclingData, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;
      setData(recyclingData || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recycling data';
      setError(errorMessage);
      Sentry.captureException(err, {
        extra: {
          context: 'useRecyclingData hook',
          options,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orderBy, orderDirection, limit]);

  const totalRecycled = data.reduce((sum, item) => sum + item.weight_kg, 0);
  const totalCO2Saved = data.reduce((sum, item) => sum + item.co2_saved_kg, 0);

  return {
    data,
    isLoading,
    error,
    totalRecycled,
    totalCO2Saved,
    refetch: fetchData,
  };
}; 