/**
 * @fileoverview Currency provider interface.
 *
 * @module data/currency.provider
 */

/**
 * Interface for currency providers.
 */
export interface CurrencyProvider {
  /**
   * Gets the exchange rate from USD to the target currency.
   *
   * @param targetCurrency - Target currency code.
   * @returns Exchange rate from USD to target currency.
   * @throws If currency is invalid or API call fails.
   */
  getExchangeRate(targetCurrency: string): Promise<number>;
}

