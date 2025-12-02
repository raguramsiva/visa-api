/**
 * @fileoverview Utility functions for visa route handlers.
 *
 * @module utils/visa.utils
 */

import { Request } from 'express';
import {
  CreateVisaDto,
  UpdateVisaDto,
  NumberOfEntries,
  defaultCurrency,
  Visa,
} from '../types';
import {
  ValidationError,
  NotFoundError,
  CurrencyUnavailableError,
} from '../errors';
import { VisaRepository } from '../data/visa.repository';
import { CurrencyService } from '../services/currency.service';

// ============================================
// ID Validation
// ============================================

/**
 * Validates and parses the ID from request parameters.
 *
 * @param req - Express request.
 * @returns Validated ID.
 * @throws If ID is invalid.
 */
export function validateId(req: Request): number {
  const id = Number(req.params.id);
  if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
    throw new ValidationError(['id must be a valid positive integer']);
  }
  return id;
}

// ============================================
// Currency Helpers
// ============================================

/**
 * Extracts and validates currency from request query parameters.
 *
 * @param req - Express request.
 * @returns Currency code, or undefined if not provided.
 */
export function getCurrency(req: Request): string | undefined {
  const currency = req.query.currency;
  return typeof currency === 'string' ? currency : undefined;
}

/**
 * Applies currency conversion to a single visa.
 *
 * @param visa - Visa to convert.
 * @param currency - Optional currency code.
 * @param currencyService - Optional currency service.
 * @returns Converted visa or original if no conversion needed.
 * @throws If currency service is unavailable.
 */
export async function applyCurrencyConversionToVisa(
  visa: Visa,
  currency: string | undefined,
  currencyService?: CurrencyService
): Promise<Visa> {
  // If no currency or currency is defaultCurrency, return as-is (no conversion needed)
  if (!currency || currency.toUpperCase() === defaultCurrency) {
    return visa;
  }

  // Only need currencyService for non-default currencies
  if (!currencyService) {
    throw new CurrencyUnavailableError();
  }

  return await currencyService.convertVisa(visa, currency);
}

/**
 * Applies currency conversion to an array of visas in a result object.
 *
 * @param result - Result with data array and total.
 * @param currency - Optional currency code.
 * @param currencyService - Optional currency service.
 * @returns Result with converted visas or original if no conversion needed.
 * @throws If currency service is unavailable.
 */
export async function applyCurrencyConversionToResult(
  result: { data: Visa[]; total: number },
  currency: string | undefined,
  currencyService?: CurrencyService
): Promise<{ data: Visa[]; total: number }> {
  // If no currency or currency is defaultCurrency, return as-is (no conversion needed)
  if (!currency || currency.toUpperCase() === defaultCurrency) {
    return result;
  }

  // Only need currencyService for non-default currencies
  if (!currencyService) {
    throw new CurrencyUnavailableError();
  }

  const convertedData = await Promise.all(
    result.data.map((visa) => currencyService.convertVisa(visa, currency))
  );
  return { ...result, data: convertedData };
}

// ============================================
// Visa Repository Helpers
// ============================================

/**
 * Gets a visa by ID from the repository or throws NotFoundError.
 *
 * @param repository - Visa repository.
 * @param id - Visa ID.
 * @param idParam - Original ID parameter (for error message).
 * @returns Visa object.
 * @throws If visa is not found.
 */
export function getVisaById(
  repository: VisaRepository,
  id: number,
  idParam: string
): Visa {
  const visa = repository.getById(id);
  if (!visa) {
    throw new NotFoundError('Visa', idParam);
  }
  return visa;
}

// ============================================
// DTO Validation
// ============================================

/**
 * Validates a CreateVisaDto object.
 *
 * @param dto - Create visa DTO.
 * @returns Validation error messages (empty if valid).
 */
export function validateCreateVisaDto(dto: CreateVisaDto): string[] {
  const errors: string[] = [];

  if (!dto.country) errors.push('country is required');
  if (!dto.visaType) errors.push('visaType is required');
  if (typeof dto.price !== 'number' || dto.price < 0) {
    errors.push('price must be a non-negative number');
  }
  if (typeof dto.lengthOfStay !== 'number' || dto.lengthOfStay < 1) {
    errors.push('lengthOfStay must be positive');
  }
  if (!Object.values(NumberOfEntries).includes(dto.numberOfEntries)) {
    errors.push(
      `numberOfEntries must be one of: ${Object.values(NumberOfEntries).join(
        ', '
      )}`
    );
  }
  if (typeof dto.filingFee !== 'number' || dto.filingFee < 0) {
    errors.push('filingFee must be a non-negative number');
  }

  return errors;
}

/**
 * Validates an UpdateVisaDto object.
 *
 * @param dto - Update visa DTO.
 * @returns Validation error messages (empty if valid).
 */
export function validateUpdateVisaDto(dto: UpdateVisaDto): string[] {
  const errors: string[] = [];

  if (
    dto.price !== undefined &&
    (typeof dto.price !== 'number' || dto.price < 0)
  ) {
    errors.push('price must be a non-negative number');
  }
  if (
    dto.lengthOfStay !== undefined &&
    (typeof dto.lengthOfStay !== 'number' || dto.lengthOfStay < 1)
  ) {
    errors.push('lengthOfStay must be positive');
  }
  if (
    dto.numberOfEntries !== undefined &&
    !Object.values(NumberOfEntries).includes(dto.numberOfEntries)
  ) {
    errors.push(
      `numberOfEntries must be one of: ${Object.values(NumberOfEntries).join(
        ', '
      )}`
    );
  }
  if (
    dto.filingFee !== undefined &&
    (typeof dto.filingFee !== 'number' || dto.filingFee < 0)
  ) {
    errors.push('filingFee must be a non-negative number');
  }

  return errors;
}

// ============================================
// Query Parsing
// ============================================

/**
 * Parses and validates query parameters for GET /api/visas endpoint.
 *
 * @param req - Express request.
 * @returns Parsed filter object for repository.getAll().
 */
export function parseQueryFilters(req: Request): {
  country?: string;
  visaType?: string;
  minPrice?: number;
  maxPrice?: number;
  numberOfEntries?: string;
  offset?: number;
  limit?: number;
} {
  const {
    country,
    visaType,
    minPrice,
    maxPrice,
    numberOfEntries,
    offset,
    limit,
  } = req.query;

  return {
    country: country as string,
    visaType: visaType as string,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    numberOfEntries: numberOfEntries as string,
    offset: offset ? Number(offset) : undefined,
    limit: limit ? Number(limit) : undefined,
  };
}
