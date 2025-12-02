/**
 * @fileoverview Repository interface for visa data persistence.
 *
 * @module data/visa.repository
 */

import { Visa, CreateVisaDto, UpdateVisaDto } from '../types';

/**
 * Repository interface for visa data access operations.
 * Abstracts persistence layer to allow different implementations.
 */
export interface VisaRepository {
  /**
   * Retrieves all visas matching the provided filters with pagination support.
   *
   * @param filters - Filter criteria and pagination.
   * @param filters.country - Country filter (partial match).
   * @param filters.visaType - Visa type filter (partial match).
   * @param filters.minPrice - Minimum price (inclusive).
   * @param filters.maxPrice - Maximum price (inclusive).
   * @param filters.numberOfEntries - Entry type filter.
   * @param filters.offset - Pagination offset.
   * @param filters.limit - Pagination limit.
   * @returns Filtered visas and total count.
   */
  getAll(filters: {
    country?: string;
    visaType?: string;
    minPrice?: number;
    maxPrice?: number;
    numberOfEntries?: string;
    offset?: number;
    limit?: number;
  }): { data: Visa[]; total: number };

  /**
   * Retrieves a visa by ID.
   *
   * @param id - Visa ID.
   * @returns Visa if found, otherwise undefined.
   */
  getById(id: number): Visa | undefined;

  /**
   * Creates a new visa.
   *
   * @param dto - Visa creation data.
   * @returns Created visa with generated ID.
   */
  create(dto: CreateVisaDto): Visa;

  /**
   * Updates an existing visa by ID.
   *
   * @param id - Visa ID.
   * @param dto - Partial visa update data.
   * @returns Updated visa if found, otherwise undefined.
   */
  update(id: number, dto: UpdateVisaDto): Visa | undefined;

  /**
   * Deletes a visa by ID.
   *
   * @param id - Visa ID.
   * @returns True if deletion was successful.
   */
  delete(id: number): boolean;
}
