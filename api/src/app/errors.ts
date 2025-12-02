/**
 * @fileoverview Application error classes for structured error handling.
 *
 * @module errors
 */

/** Base error class with HTTP status code and optional details. */
export class AppError extends Error {
  /**
   * Creates a new application error.
   *
   * @param statusCode - HTTP status code.
   * @param message - Error message.
   * @param details - Optional error details.
   */
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Error for request validation failures. */
export class ValidationError extends AppError {
  /**
   * Creates a new validation error.
   *
   * @param details - Validation error messages.
   */
  constructor(details: string[]) {
    super(400, 'Validation failed', details);
  }
}

/** Error for resource not found (404). */
export class NotFoundError extends AppError {
  /**
   * Creates a new not found error.
   *
   * @param resource - Resource type name.
   * @param id - Optional resource ID.
   */
  constructor(resource: string, id?: string) {
    super(
      404,
      id ? `${resource} with id "${id}" not found` : `${resource} not found`
    );
  }
}

/** Error when currency conversion service is unavailable. */
export class CurrencyUnavailableError extends AppError {
  constructor() {
    super(503, 'Currency exchange rates are currently unavailable', {
      message:
        'Currency exchange rates are currently unavailable. Please retry later.',
      fallback:
        'USD results are available without currency conversion. Omit the currency parameter to get USD prices.',
    });
  }
}

/** Error for database operation failures. */
export class DatabaseError extends AppError {
  /**
   * Creates a new database error.
   *
   * @param message - Error message.
   * @param details - Optional error details.
   */
  constructor(message: string, details?: unknown) {
    super(500, message, details);
  }
}
