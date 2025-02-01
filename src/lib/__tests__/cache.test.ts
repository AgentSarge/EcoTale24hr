import { vi, describe, it, expect, beforeEach } from 'vitest';
import { cache } from '../cache';

describe('CacheService', () => {
  beforeEach(() => {
    // Clear cache and localStorage before each test
    cache.clear();
    localStorage.clear();
  });

  it('should store and retrieve values', () => {
    const testData = { id: 1, name: 'Test' };
    cache.set('test-key', testData);
    const retrieved = cache.get('test-key');
    expect(retrieved).toEqual(testData);
  });

  it('should respect TTL', async () => {
    const testData = { id: 1, name: 'Test' };
    cache.set('test-key', testData, 100); // 100ms TTL

    // Value should be available immediately
    expect(cache.get('test-key')).toEqual(testData);

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    // Value should be null after TTL
    expect(cache.get('test-key')).toBeNull();
  });

  it('should persist to localStorage', () => {
    const testData = { id: 1, name: 'Test' };
    cache.set('test-key', testData);

    // Check localStorage
    const stored = localStorage.getItem('cache:test-key');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.value).toEqual(testData);
  });

  it('should load from localStorage on initialization', () => {
    const testData = { id: 1, name: 'Test' };
    const mockItem = {
      value: testData,
      timestamp: Date.now(),
      ttl: 3600000,
    };

    localStorage.setItem('cache:test-key', JSON.stringify(mockItem));

    // Create new instance to trigger initialization
    const retrieved = cache.get('test-key');
    expect(retrieved).toEqual(testData);
  });

  it('should handle removal of items', () => {
    const testData = { id: 1, name: 'Test' };
    cache.set('test-key', testData);
    expect(cache.get('test-key')).toEqual(testData);

    cache.remove('test-key');
    expect(cache.get('test-key')).toBeNull();
    expect(localStorage.getItem('cache:test-key')).toBeNull();
  });

  it('should clear all items', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    cache.clear();
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
    expect(localStorage.getItem('cache:key1')).toBeNull();
    expect(localStorage.getItem('cache:key2')).toBeNull();
  });

  it('should handle storage quota exceeded', () => {
    const mockError = new Error('QuotaExceededError');
    mockError.name = 'QuotaExceededError';
    
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem');
    mockSetItem.mockImplementationOnce(() => {
      throw mockError;
    });

    // Fill cache with some items
    for (let i = 0; i < 10; i++) {
      cache.set(`key${i}`, `value${i}`);
    }

    // This should trigger quota exceeded and cleanup
    cache.set('new-key', 'new-value');

    // Should still be able to get the new value
    expect(cache.get('new-key')).toBe('new-value');
  });

  it('should provide accurate stats', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    const stats = cache.getStats();
    expect(stats.itemCount).toBe(2);
    expect(stats.oldestItem).toBe(now);
    expect(stats.newestItem).toBe(now);
    expect(stats.totalSize).toBeGreaterThan(0);
  });
}); 