type CacheItem<T> = {
  value: T;
  timestamp: number;
  ttl: number;
};

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheItem<any>>;
  private storage: Storage;

  private constructor() {
    this.cache = new Map();
    this.storage = window.localStorage;
    this.initFromStorage();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private initFromStorage(): void {
    try {
      const keys = Object.keys(this.storage);
      for (const key of keys) {
        if (key.startsWith('cache:')) {
          const item = JSON.parse(this.storage.getItem(key) || '');
          if (!this.isExpired(item)) {
            this.cache.set(key.slice(6), item);
          } else {
            this.storage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing cache from storage:', error);
    }
  }

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() > item.timestamp + item.ttl;
  }

  public set<T>(key: string, value: T, ttl: number = 3600000): void {
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, item);

    try {
      this.storage.setItem(`cache:${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Error saving to storage:', error);
      // If storage is full, clear old items
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearOldItems();
      }
    }
  }

  public get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T>;

    if (!item) {
      return null;
    }

    if (this.isExpired(item)) {
      this.remove(key);
      return null;
    }

    return item.value;
  }

  public remove(key: string): void {
    this.cache.delete(key);
    this.storage.removeItem(`cache:${key}`);
  }

  public clear(): void {
    this.cache.clear();
    const keys = Object.keys(this.storage);
    for (const key of keys) {
      if (key.startsWith('cache:')) {
        this.storage.removeItem(key);
      }
    }
  }

  private clearOldItems(): void {
    const items = Array.from(this.cache.entries());
    items.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest 20% of items
    const itemsToRemove = Math.ceil(items.length * 0.2);
    items.slice(0, itemsToRemove).forEach(([key]) => {
      this.remove(key);
    });
  }

  public getStats(): {
    itemCount: number;
    oldestItem: number;
    newestItem: number;
    totalSize: number;
  } {
    const items = Array.from(this.cache.values());
    const timestamps = items.map(item => item.timestamp);

    return {
      itemCount: this.cache.size,
      oldestItem: Math.min(...timestamps),
      newestItem: Math.max(...timestamps),
      totalSize: new Blob([JSON.stringify(Array.from(this.cache.entries()))]).size,
    };
  }
}

export const cache = CacheService.getInstance(); 