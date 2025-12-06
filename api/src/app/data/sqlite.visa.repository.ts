/**
 * @fileoverview SQLite implementation of the visa repository.
 *
 * @module data/sqlite.visa.repository
 */

import * as path from 'path';
import * as fs from 'fs';
import Database, { type Database as DatabaseType } from 'better-sqlite3';
import { Visa, CreateVisaDto, UpdateVisaDto, VisaListResult } from '../types';
import { VisaRepository } from './visa.repository';
import { DatabaseError } from '../errors';
import { Cache } from './cache';

let db: DatabaseType | null = null;

/**
 * Gets or initializes SQLite database connection.
 * Creates from master template if missing and initializes schema.
 * Throws DatabaseError if initialization fails.
 */
function getDb(): DatabaseType {
  if (!db) {
    try {
      const dbDir = path.join(process.cwd(), 'db');
      const dbFileName =
        process.env.NODE_ENV === 'test' ? 'visas.test.db' : 'visas.db';
      const dbPath = path.join(dbDir, dbFileName);
      const masterDbPath = path.join(dbDir, 'visas.master.db');

      if (!fs.existsSync(dbPath) && fs.existsSync(masterDbPath)) {
        fs.copyFileSync(masterDbPath, dbPath);
      }

      db = new Database(dbPath);
      db.exec(`
        CREATE TABLE IF NOT EXISTS visas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          country TEXT NOT NULL,
          visaType TEXT NOT NULL,
          price REAL NOT NULL,
          lengthOfStay INTEGER NOT NULL,
          numberOfEntries TEXT NOT NULL,
          filingFee REAL NOT NULL
        )
      `);
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new DatabaseError('Failed to initialize database', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return db;
}

/**
 * Builds SQL WHERE clause and parameters from filter criteria.
 *
 * @param filters - Filter criteria.
 * @returns Object with `clause` string and `params` array.
 */
function buildWhere(filters: {
  country?: string;
  visaType?: string;
  minPrice?: number;
  maxPrice?: number;
  numberOfEntries?: string;
}): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.country) {
    conditions.push('LOWER(country) LIKE ?');
    params.push(`%${filters.country.toLowerCase()}%`);
  }
  if (filters.visaType) {
    conditions.push('LOWER(visaType) LIKE ?');
    params.push(`%${filters.visaType.toLowerCase()}%`);
  }
  if (filters.minPrice !== undefined) {
    conditions.push('price >= ?');
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push('price <= ?');
    params.push(filters.maxPrice);
  }
  if (filters.numberOfEntries) {
    conditions.push('numberOfEntries = ?');
    params.push(filters.numberOfEntries);
  }

  const clause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

/** SQLite implementation of VisaRepository with in-memory caching for getAll method. */
export class SqliteVisaRepository implements VisaRepository {
  /**
   * Retrieves all visas matching filters with pagination.
   */

  private readonly cache: Cache<VisaListResult>;

  constructor() {
    this.cache = new Cache<VisaListResult>();
  }

  getAll(filters: {
    country?: string;
    visaType?: string;
    minPrice?: number;
    maxPrice?: number;
    numberOfEntries?: string;
    offset?: number;
    limit?: number;
  }): VisaListResult {
    // Check cache first if no filters are provided
    if (Object.keys(filters).length === 0) {
      const cachedVisaListResult = this.cache.get();
      if (cachedVisaListResult) {
        return cachedVisaListResult;
      }
    }
    const database = getDb();
    const { clause: whereClause, params } = buildWhere(filters);

    const countResult = database
      .prepare(`SELECT COUNT(*) as count FROM visas ${whereClause}`)
      .get(...params) as { count: number };
    const total = countResult.count;

    const offset = Math.max(0, filters.offset || 0);
    const limit = Math.min(100, filters.limit || 100);
    const queryParams = [...params, limit, offset];
    const data = database
      .prepare(`SELECT * FROM visas ${whereClause} LIMIT ? OFFSET ?`)
      .all(...queryParams) as Visa[];

    const visaListResult: VisaListResult = { data, total };
    // Cache the result
    this.cache.set(visaListResult);

    return visaListResult;
  }

  /**
   * Retrieves a visa by its ID.
   */
  getById(id: number): Visa | undefined {
    return getDb().prepare('SELECT * FROM visas WHERE id = ?').get(id) as
      | Visa
      | undefined;
  }

  /**
   * Creates a new visa entry in the database.
   */
  create(dto: CreateVisaDto): Visa {
    const database = getDb();
    const insert = database.prepare(
      'INSERT INTO visas (country, visaType, price, lengthOfStay, numberOfEntries, filingFee) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = insert.run(
      dto.country,
      dto.visaType,
      dto.price,
      dto.lengthOfStay,
      dto.numberOfEntries,
      dto.filingFee
    );
    const id = result.lastInsertRowid as number;
    // Clear cache
    this.cache.clear();

    return { id, ...dto };
  }

  /**
   * Updates an existing visa by ID.
   * Returns undefined if visa not found.
   */
  update(id: number, dto: UpdateVisaDto): Visa | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;

    const updates: string[] = [];
    const params: unknown[] = [];

    if (dto.country !== undefined) {
      updates.push('country = ?');
      params.push(dto.country);
    }
    if (dto.visaType !== undefined) {
      updates.push('visaType = ?');
      params.push(dto.visaType);
    }
    if (dto.price !== undefined) {
      updates.push('price = ?');
      params.push(dto.price);
    }
    if (dto.lengthOfStay !== undefined) {
      updates.push('lengthOfStay = ?');
      params.push(dto.lengthOfStay);
    }
    if (dto.numberOfEntries !== undefined) {
      updates.push('numberOfEntries = ?');
      params.push(dto.numberOfEntries);
    }
    if (dto.filingFee !== undefined) {
      updates.push('filingFee = ?');
      params.push(dto.filingFee);
    }

    if (updates.length === 0) return existing;

    params.push(id);
    getDb()
      .prepare(`UPDATE visas SET ${updates.join(', ')} WHERE id = ?`)
      .run(...params);
    // Clear cache
    this.cache.clear();

    return this.getById(id);
  }

  /**
   * Deletes a visa by ID.
   * Returns true if deletion was successful.
   */
  delete(id: number): boolean {
    const result = getDb().prepare('DELETE FROM visas WHERE id = ?').run(id);
    // Clear cache
    this.cache.clear();

    return result.changes > 0;
  }
}
