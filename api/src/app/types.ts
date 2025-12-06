/**
 * @fileoverview Core type definitions and domain models for the Visa application.
 *
 * @module types
 */

/** Default currency code. All prices stored in USD. */
export const defaultCurrency = 'USD' as const;

export type DefaultCurrency = typeof defaultCurrency;

/** Visa entry type enumeration. */
export enum NumberOfEntries {
  Single = 'Single',
  Multiple = 'Multiple',
}

/**
 * Visa entity. All monetary values stored in USD.
 */
export interface Visa {
  id: number;
  country: string;
  visaType: string;
  price: number;
  lengthOfStay: number;
  numberOfEntries: NumberOfEntries;
  filingFee: number;
}

/**
 * Result of a list of paginated visa results and total count.
 */
export type VisaListResult = { data: Visa[]; total: number };

/**
 * DTO for creating a new visa. All monetary values in USD.
 */
export interface CreateVisaDto {
  country: string;
  visaType: string;
  price: number;
  lengthOfStay: number;
  numberOfEntries: NumberOfEntries;
  filingFee: number;
}

/**
 * DTO for updating a visa. All fields optional. Monetary values in USD.
 */
export interface UpdateVisaDto {
  country?: string;
  visaType?: string;
  price?: number;
  lengthOfStay?: number;
  numberOfEntries?: NumberOfEntries;
  filingFee?: number;
}

/**
 * Record of currency codes and their exchange rates with respect to USD.
 */
export type CurrencyRate = Record<string, number>;
