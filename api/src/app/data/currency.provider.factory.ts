/**
 * @fileoverview Factory for creating currency provider instances.
 *
 * @module data/currency.provider.factory
 */

import { CurrencyProvider } from './currency.provider';
import { ExchangeRateApiProvider } from './exchangerate-api.provider';

/**
 * Creates a currency provider instance based on the given API name.
 *
 * @param apiKey - API authentication key.
 * @param apiName - Provider name (e.g., "ExchangeRate-API").
 * @param [cacheTtlMinutes=1440] - Cache TTL in minutes (default: 1 day).
 * @returns Configured provider instance.
 * @throws If API name is not supported.
 */
export function createCurrencyProvider(
  apiKey: string,
  apiName: string,
  cacheTtlMinutes = 24 * 60
): CurrencyProvider {
  const ttl = cacheTtlMinutes ?? 24 * 60;
  switch (apiName) {
    case 'ExchangeRate-API':
      return new ExchangeRateApiProvider(apiKey, ttl);

    default:
      throw new Error(
        `Unknown currency API provider: "${apiName}". Supported providers: ExchangeRate-API`
      );
  }
}

