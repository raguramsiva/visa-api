import 'dotenv/config';
import * as path from 'path';
import * as fs from 'fs';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { createApp } from '../../../api/src/app/app';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { SqliteVisaRepository } from '../../../api/src/app/data/sqlite.visa.repository';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { createCurrencyProvider } from '../../../api/src/app/data/currency.provider.factory';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { CurrencyService } from '../../../api/src/app/services/currency.service';
import type { Server } from 'http';

let server: Server | null = null;

export async function setup(): Promise<void> {
  // Set NODE_ENV to test so the app uses the test database
  process.env.NODE_ENV = 'test';

  // Reset test database from master before each test run
  const dbDir = path.join(process.cwd(), 'db');
  const masterDbPath = path.join(dbDir, 'visas.master.db');
  const testDbPath = path.join(dbDir, 'visas.test.db');

  if (fs.existsSync(masterDbPath)) {
    fs.copyFileSync(masterDbPath, testDbPath);
  }

  // Start the server (currency service is optional)
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
  // Use TEST_HOST and TEST_PORT for test server to avoid conflicts with main server
  const host = process.env.TEST_HOST ?? 'localhost';
  const port = process.env.TEST_PORT ? Number(process.env.TEST_PORT) : 3001; // Default to 3001 for tests

  await new Promise<void>((resolve) => {
    server = app.listen(port, host, () => {
      console.log(`[ ready ] http://${host}:${port}`);
      resolve();
    });
  });
}

export async function teardown(): Promise<void> {
  // Close the server
  if (server) {
    const serverToClose = server;
    server = null;
    await new Promise<void>((resolve) => {
      serverToClose.close(() => resolve());
    });
  }

  // Reset test database from master after tests complete
  const dbDir = path.join(process.cwd(), 'db');
  const masterDbPath = path.join(dbDir, 'visas.master.db');
  const testDbPath = path.join(dbDir, 'visas.test.db');

  if (fs.existsSync(masterDbPath)) {
    fs.copyFileSync(masterDbPath, testDbPath);
  }
}
