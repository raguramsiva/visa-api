/**
 * @fileoverview In-memory cache for provided generic type with TTL support.
 *
 * @module data/cache
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/** In-memory cache with TTL validation. */
export class Cache<T> {
  private cache: CacheEntry<T> | null = null;
  private readonly ttl: number;

  /**
   * @param [ttlMinutes=60] - Cache TTL in minutes
   */
  constructor(ttlMinutes = 60) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  /**
   * @returns true if cache exists and is within TTL
   */
  isValid(): boolean {
    if (!this.cache) {
      return false;
    }
    const now = Date.now(); // UTC timestamp in milliseconds
    const age = now - this.cache.timestamp;
    return age < this.ttl;
  }

  /**
   * @returns Cached data, if valid
   */
  get(): T | null {
    if (this.isValid() && this.cache) {
      return this.cache.data;
    }
    return null;
  }

  /**
   * @param data - Cache the data.
   */
  set(data: T): void {
    this.cache = {
      data: data,
      timestamp: Date.now(), // UTC timestamp in milliseconds
    };
  }

  /** Clears the cache. */
  clear(): void {
    this.cache = null;
  }
}
