import { Router, Request, Response } from 'express';
import { CreateVisaDto, UpdateVisaDto } from '../types';
import { ValidationError, NotFoundError } from '../errors';
import { asyncHandler } from '../middleware/async-handler';
import { VisaRepository } from '../data/visa.repository';
import { CurrencyService } from '../services/currency.service';
import {
  validateId,
  getCurrency,
  applyCurrencyConversionToVisa,
  applyCurrencyConversionToResult,
  getVisaById,
  validateCreateVisaDto,
  validateUpdateVisaDto,
  parseQueryFilters,
} from '../utils/visa.utils';

/**
 * @swagger
 * components:
 *   schemas:
 *     Visa:
 *       type: object
 *       required:
 *         - id
 *         - country
 *         - visaType
 *         - price
 *         - lengthOfStay
 *         - numberOfEntries
 *         - filingFee
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the visa
 *         country:
 *           type: string
 *           description: Country name
 *         visaType:
 *           type: string
 *           description: Type of visa
 *         price:
 *           type: number
 *           format: float
 *           description: Price in USD
 *         lengthOfStay:
 *           type: integer
 *           description: Length of stay in days
 *         numberOfEntries:
 *           type: string
 *           enum: [Single, Multiple]
 *           description: Number of entries allowed
 *         filingFee:
 *           type: number
 *           format: float
 *           description: Filing fee in USD
 *     VisaListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Visa'
 *         total:
 *           type: integer
 *           description: Total number of visas matching the filters
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         details:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @fileoverview Visa management API routes.
 *
 * @module routes/visas
 */

/**
 * Creates a router for visa management endpoints.
 *
 * @param repository - Visa data repository.
 * @param currencyService - Optional currency service.
 * @returns Configured Express router.
 */
export function createVisasRouter(
  repository: VisaRepository,
  currencyService?: CurrencyService
): Router {
  const router = Router();

  /**
   * @swagger
   * /api/visas:
   *   get:
   *     summary: List all visas with pagination and filtering
   *     tags: [Visas]
   *     parameters:
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *           default: 0
   *         description: Starting index for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *           maximum: 100
   *         description: Number of results to return
   *       - in: query
   *         name: country
   *         schema:
   *           type: string
   *         description: Filter by country (partial match)
   *       - in: query
   *         name: visaType
   *         schema:
   *           type: string
   *         description: Filter by visa type (partial match)
   *       - in: query
   *         name: minPrice
   *         schema:
   *           type: number
   *         description: Minimum price filter
   *       - in: query
   *         name: maxPrice
   *         schema:
   *           type: number
   *         description: Maximum price filter
   *       - in: query
   *         name: numberOfEntries
   *         schema:
   *           type: string
   *           enum: [Single, Multiple]
   *         description: Filter by number of entries
   *       - in: query
   *         name: currency
   *         schema:
   *           type: string
   *           default: USD
   *         description: Currency code for price conversion (e.g., EUR, GBP). Defaults to USD.
   *     responses:
   *       200:
   *         description: List of visas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/VisaListResponse'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       503:
   *         description: Currency service unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const filters = parseQueryFilters(req);
      const result = repository.getAll(filters);
      const currency = getCurrency(req);
      const convertedResult = await applyCurrencyConversionToResult(
        result,
        currency,
        currencyService
      );
      res.json(convertedResult);
    })
  );

  /**
   * @swagger
   * /api/visas/{id}:
   *   get:
   *     summary: Get a visa by ID
   *     tags: [Visas]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Visa ID
   *       - in: query
   *         name: currency
   *         schema:
   *           type: string
   *           default: USD
   *         description: Currency code for price conversion (e.g., EUR, GBP). Defaults to USD.
   *     responses:
   *       200:
   *         description: Visa details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Visa'
   *       400:
   *         description: Invalid ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Visa not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       503:
   *         description: Currency service unavailable
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const id = validateId(req);
      const visa = getVisaById(repository, id, req.params.id);
      const currency = getCurrency(req);
      const convertedVisa = await applyCurrencyConversionToVisa(
        visa,
        currency,
        currencyService
      );
      res.json(convertedVisa);
    })
  );

  /**
   * @swagger
   * /api/visas:
   *   post:
   *     summary: Create a new visa
   *     tags: [Visas]
   *     description: Creates a new visa. All prices must be provided in USD. Visas are always created and stored in USD.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - country
   *               - visaType
   *               - price
   *               - lengthOfStay
   *               - numberOfEntries
   *               - filingFee
   *             properties:
   *               country:
   *                 type: string
   *               visaType:
   *                 type: string
   *               price:
   *                 type: number
   *                 format: float
   *               lengthOfStay:
   *                 type: integer
   *               numberOfEntries:
   *                 type: string
   *                 enum: [Single, Multiple]
   *               filingFee:
   *                 type: number
   *                 format: float
   *     responses:
   *       201:
   *         description: Visa created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Visa'
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const dto: CreateVisaDto = req.body;
      const errors = validateCreateVisaDto(dto);

      if (errors.length > 0) {
        throw new ValidationError(errors);
      }

      const visa = repository.create(dto);
      // Visas are always created and stored in USD
      res.status(201).json(visa);
    })
  );

  /**
   * @swagger
   * /api/visas/{id}:
   *   put:
   *     summary: Update a visa
   *     tags: [Visas]
   *     description: Updates a visa. All prices must be provided in USD. Visas are always stored in USD.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Visa ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               country:
   *                 type: string
   *               visaType:
   *                 type: string
   *               price:
   *                 type: number
   *                 format: float
   *               lengthOfStay:
   *                 type: integer
   *               numberOfEntries:
   *                 type: string
   *                 enum: [Single, Multiple]
   *               filingFee:
   *                 type: number
   *                 format: float
   *     responses:
   *       200:
   *         description: Visa updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Visa'
   *       400:
   *         description: Validation error or invalid ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Visa not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.put(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const id = validateId(req);
      const dto: UpdateVisaDto = req.body;
      const errors = validateUpdateVisaDto(dto);

      if (errors.length > 0) {
        throw new ValidationError(errors);
      }

      const visa = repository.update(id, dto);
      if (!visa) {
        throw new NotFoundError('Visa', req.params.id);
      }
      // Visas are always stored and returned in USD
      res.json(visa);
    })
  );

  /**
   * @swagger
   * /api/visas/{id}:
   *   delete:
   *     summary: Delete a visa
   *     tags: [Visas]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: Visa ID
   *     responses:
   *       204:
   *         description: Visa deleted successfully
   *       400:
   *         description: Invalid ID
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Visa not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.delete(
    '/:id',
    asyncHandler(async (req: Request, res: Response) => {
      const id = validateId(req);
      const deleted = repository.delete(id);
      if (!deleted) {
        throw new NotFoundError('Visa', req.params.id);
      }
      res.status(204).send();
    })
  );

  return router;
}
