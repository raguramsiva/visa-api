/**
 * @fileoverview In-memory cache for currency exchange rates with TTL support.
 *
 * @module data/currency.cache
 */

interface CacheEntry {
  rates: Record<string, number>;
  timestamp: number;
}

/** In-memory cache for currency exchange rates with TTL validation. */
export class CurrencyCache {
  private cache: CacheEntry | null = null;
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
   * @returns Cached rates if valid
   */
  get(): Record<string, number> | null {
    if (this.isValid() && this.cache) {
      return this.cache.rates;
    }
    return null;
  }

  /**
   * @param rates - Exchange rates to cache
   */
  set(rates: Record<string, number>): void {
    this.cache = {
      rates,
      timestamp: Date.now(), // UTC timestamp in milliseconds
    };
  }

  /** Clears the cache. */
  clear(): void {
    this.cache = null;
  }
}

