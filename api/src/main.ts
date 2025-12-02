/**
 * @fileoverview Application entry point.
 *
 * @module main
 */

import 'dotenv/config';
import { createApp } from './app/app';
import { SqliteVisaRepository } from './app/data/sqlite.visa.repository';
import { createCurrencyProvider } from './app/data/currency.provider.factory';
import { CurrencyService } from './app/services/currency.service';

const repository = new SqliteVisaRepository();

// Currency API configuration
const CURRENCY_API_KEY = process.env.CURRENCY_API_KEY;
const CURRENCY_API_NAME = process.env.CURRENCY_API_NAME;
const CURRENCY_CACHE_TTL_MINUTES = process.env.CURRENCY_CACHE_TTL_MINUTES
  ? Number(process.env.CURRENCY_CACHE_TTL_MINUTES)
  : undefined;

// Create currency service if API key and name are provided
const currencyService =
  CURRENCY_API_KEY && CURRENCY_API_NAME
    ? new CurrencyService(
        createCurrencyProvider(
          CURRENCY_API_KEY,
          CURRENCY_API_NAME,
          CURRENCY_CACHE_TTL_MINUTES
        )
      )
    : undefined;

const app = createApp(repository, currencyService);
const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
