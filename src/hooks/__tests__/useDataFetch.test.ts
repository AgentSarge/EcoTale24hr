import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDataFetch } from '../useDataFetch';

const mockData = { id: 1, name: 'Test' };
const testUrl = 'test-url';

vi.mock('../useCache', () => ({
  useCache: () => ({
    get: vi.fn(),
    set: vi.fn(),
  }),
}));

describe('useDataFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it('should fetch data successfully', async () => {
    const mockResponse = new Response(JSON.stringify(mockData), { status: 200 });
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useDataFetch(testUrl));

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(testUrl, expect.any(Object));
  });

  it('should use cached data if available', async () => {
    const cache = {
      get: vi.fn().mockReturnValue(mockData),
      set: vi.fn(),
    };

    const { result } = renderHook(() => useDataFetch(testUrl, { cache }));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(global.fetch).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useDataFetch(testUrl));

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(error);
  });

  it('should handle non-ok responses', async () => {
    const mockResponse = new Response('Not Found', { status: 404 });
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useDataFetch(testUrl));

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('404');
  });

  it('should handle invalid JSON responses', async () => {
    const mockResponse = new Response('Invalid JSON', { status: 200 });
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useDataFetch(testUrl));

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should refetch data when dependencies change', async () => {
    const mockResponse = new Response(JSON.stringify(mockData), { status: 200 });
    vi.mocked(global.fetch).mockResolvedValue(mockResponse);

    const { result, rerender } = renderHook(
      ({ dep }) => useDataFetch(testUrl, { dependencies: [dep] }),
      { initialProps: { dep: 1 } }
    );

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    rerender({ dep: 2 });

    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should abort fetch when component unmounts', async () => {
    const mockAbort = vi.fn();
    const mockSignal = { aborted: false };
    const mockController = { abort: mockAbort, signal: mockSignal };
    
    vi.spyOn(window, 'AbortController').mockImplementationOnce(() => mockController as unknown as AbortController);

    const mockResponse = new Response(JSON.stringify(mockData), { status: 200 });
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

    const { unmount } = renderHook(() => useDataFetch(testUrl));

    unmount();

    expect(mockAbort).toHaveBeenCalled();
  });
});