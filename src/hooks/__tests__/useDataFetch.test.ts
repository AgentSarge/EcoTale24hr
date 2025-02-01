import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useDataFetch } from '../useDataFetch';
import { cache } from '@/lib/cache';
import { monitoring } from '@/lib/monitoring';

// Mock dependencies
vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

vi.mock('@/lib/monitoring', () => ({
  monitoring: {
    startPerformanceTransaction: vi.fn(() => ({
      finish: vi.fn(),
    })),
    captureException: vi.fn(),
  },
}));

describe('useDataFetch', () => {
  const mockData = { id: 1, name: 'Test' };
  const testUrl = 'https://api.example.com/data';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should fetch data successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useDataFetch(testUrl));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(cache.set).toHaveBeenCalledWith(
      `fetch:${testUrl}`,
      mockData,
      5 * 60 * 1000
    );
  });

  it('should return cached data if available', async () => {
    (cache.get as jest.Mock).mockReturnValueOnce(mockData);

    const { result } = renderHook(() => useDataFetch(testUrl));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Network error');
    (global.fetch as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useDataFetch(testUrl));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeNull();
    expect(monitoring.captureException).toHaveBeenCalledWith(error, { url: testUrl });
  });

  it('should handle HTTP errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useDataFetch(testUrl));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error?.message).toContain('404');
    expect(result.current.data).toBeNull();
  });

  it('should refetch data when dependencies change', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result, rerender } = renderHook(
      ({ id }) => useDataFetch(`${testUrl}/${id}`, { dependencies: [id] }),
      { initialProps: { id: 1 } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Change dependency
    rerender({ id: 2 });

    expect(result.current.isLoading).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should force refetch when calling refetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useDataFetch(testUrl));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Call refetch
    await result.current.refetch();

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should respect custom TTL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const customTTL = 10000;
    const { result } = renderHook(() =>
      useDataFetch(testUrl, { cacheTTL: customTTL })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(cache.set).toHaveBeenCalledWith(
      `fetch:${testUrl}`,
      mockData,
      customTTL
    );
  });
});