/**
 * @fileoverview ExchangeRate-API provider implementation.
 * Uses ExchangeRate-API service from https://www.exchangerate-api.com/
 *
 * @module data/exchangerate-api.provider
 */

import axios from 'axios';
import { CurrencyProvider } from './currency.provider';
import { CurrencyCache } from './currency.cache';

interface ExchangeRateApiResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

/**
 * ExchangeRate-API v6 provider with in-memory caching.
 * Fetches all rates in one API call and caches them.
 * Uses the ExchangeRate-API service from https://www.exchangerate-api.com/
 */
export class ExchangeRateApiProvider implements CurrencyProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly cache: CurrencyCache;

  /**
   * @param apiKey - ExchangeRate-API key
   * @param [ttlMinutes=60] - Cache TTL in minutes
   */
  constructor(apiKey: string, ttlMinutes = 60) {
    this.apiKey = apiKey;
    this.baseUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
    this.cache = new CurrencyCache(ttlMinutes);
  }

  /**
   * Checks cache first, then fetches from API if needed.
   * @throws If currency invalid or API call fails
   */
  async getExchangeRate(targetCurrency: string): Promise<number> {
    const currency = targetCurrency.toUpperCase();

    // Check cache first
    const cachedRates = this.cache.get();
    if (cachedRates && typeof cachedRates[currency] === 'number') {
      return cachedRates[currency];
    }

    // Cache miss or expired - fetch from API
    try {
      const response = await axios.get<ExchangeRateApiResponse>(this.baseUrl);
      const rates = response.data.conversion_rates;

      if (!rates || typeof rates[currency] !== 'number') {
        throw new Error(`Currency '${currency}' not found in exchange rates`);
      }

      // Update cache with all rates (API returns all rates at once)
      this.cache.set(rates);

      return rates[currency];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch exchange rates: ${error.message}`);
      }
      throw error;
    }
  }
}
