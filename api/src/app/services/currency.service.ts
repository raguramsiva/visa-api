/**
 * @fileoverview Currency conversion service.
 *
 * @module services/currency
 */

import { CurrencyProvider } from '../data/currency.provider';
import { Visa } from '../types';
import { CurrencyUnavailableError } from '../errors';

/**
 * Service for currency conversion operations.
 * Converts USD amounts to other currencies with rounding to 2 decimal places.
 */
export class CurrencyService {
  /**
   * Creates a new currency service instance.
   *
   * @param currencyProvider - Currency provider.
   */
  constructor(private readonly currencyProvider: CurrencyProvider) {}

  /**
   * Converts a USD amount to the target currency.
   *
   * @param usdAmount - Amount in USD.
   * @param targetCurrency - Target currency code.
   * @returns Converted amount rounded to 2 decimal places.
   * @throws If conversion fails.
   */
  async convertFromUSD(
    usdAmount: number,
    targetCurrency: string
  ): Promise<number> {
    // If target currency is USD, no conversion needed
    if (targetCurrency.toUpperCase() === 'USD') {
      return usdAmount;
    }

    try {
      const rate = await this.currencyProvider.getExchangeRate(targetCurrency);
      const converted = usdAmount * rate;
      return Math.round(converted * 100) / 100; // Round to 2 decimal places
    } catch {
      // Throw error to indicate currency conversion is unavailable
      throw new CurrencyUnavailableError();
    }
  }

  /**
   * Converts a visa object's price and filingFee to the target currency.
   *
   * @param visa - Visa to convert.
   * @param currency - Optional target currency code.
   * @returns Visa with converted prices, or original if no currency provided.
   */
  async convertVisa(visa: Visa, currency?: string): Promise<Visa> {
    if (!currency) {
      return visa;
    }
    return {
      ...visa,
      price: await this.convertFromUSD(visa.price, currency),
      filingFee: await this.convertFromUSD(visa.filingFee, currency),
    };
  }
}
