# Visa API

A REST API for managing visas with currency conversion support. Built primarily with TypeScript, Node.js, and Express.js.

## Table of Contents

- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Application Files](#application-files)
- [Data Files](#data-files)
- [Architecture & Design Decisions](#architecture--design-decisions)
  - [Focus Areas](#focus-areas)
  - [Key Architectural Decisions](#key-architectural-decisions)
  - [Scaling Considerations](#scaling-considerations)
  - [Future Improvements](#future-improvements)

## Installation

```bash
npm install
```

## Setup

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
HOST=localhost
PORT=3000

# Test Server Configuration
TEST_HOST=localhost
TEST_PORT=3001

# 3rd Party Currency API (Optional - API works without it in USD-only mode)
CURRENCY_API_KEY=your_api_key_here
CURRENCY_API_NAME=ExchangeRate-API
CURRENCY_CACHE_TTL_MINUTES=60

# Rate Limiting (Optional - defaults to 200 requests per minute)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=200
```

**Note:** The API works without currency conversion. If `CURRENCY_API_KEY` is not provided, the API will operate in USD-only mode.

**Note:** The only supported currency API currently is ExchangeRate-API. Link: https://www.exchangerate-api.com/

**Note:** Rate limiting is enabled by default (200 requests per minute per IP address). Configure via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` environment variables.

### Database Info

The application currently uses SQLite databases in the `db/` directory:

- **`db/visas.db`** - Production database (created automatically)
- **`db/visas.test.db`** - Test database (created automatically when running tests)
- **`db/visas.master.db`** - Master copy (source of truth, used to initialize databases)

If `visas.master.db` exists, it will be copied to `visas.db` on first run if the database doesn't exist.

## Usage

### Start the Production Server

```bash
npx nx run api:serve
```

**Production Server:**

- **URL:** http://localhost:3000
- **Health Check:** http://localhost:3000/health
- **API Documentation:** http://localhost:3000/api-docs

### Run e2e Tests

In a separate terminal:

```bash
npx nx e2e api-e2e
```

**Note:** e2e tests by default runs on port **3001** (separate from the main server on port 3000) and uses a separate test database (`db/visas.test.db`). You can run both the main server and e2e tests simultaneously without conflicts.

### Example API Calls

```bash
# List all visas
curl http://localhost:3000/api/visas

# List visas with filters
curl "http://localhost:3000/api/visas?country=USA&limit=5&currency=EUR"

# Get a specific visa
curl http://localhost:3000/api/visas/1?currency=GBP

# Create a new visa
curl -X POST http://localhost:3000/api/visas \
  -H "Content-Type: application/json" \
  -d '{
    "country": "USA",
    "visaType": "Tourist",
    "price": 100,
    "lengthOfStay": 90,
    "numberOfEntries": "Multiple",
    "filingFee": 10
  }'

# Update a visa
curl -X PUT http://localhost:3000/api/visas/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 150}'

# Delete a visa
curl -X DELETE http://localhost:3000/api/visas/1
```

## API Documentation

### OpenAPI/Swagger Documentation

Interactive API documentation is available at:

**http://localhost:3000/api-docs**

This provides a complete interactive interface to explore and test all API endpoints.

### API Endpoints

| Method | Endpoint         | Description                     |
| ------ | ---------------- | ------------------------------- |
| GET    | `/api/visas`     | List all visas (with filtering) |
| GET    | `/api/visas/:id` | Get a visa by ID                |
| POST   | `/api/visas`     | Create a new visa               |
| PUT    | `/api/visas/:id` | Update a visa                   |
| DELETE | `/api/visas/:id` | Delete a visa                   |

### Query Parameters

**GET /api/visas:**

- `offset` - Starting index (default: 0)
- `limit` - Number of results (default: 100, max: 100)
- `country` - Filter by country (partial match, case-insensitive)
- `visaType` - Filter by visa type (partial match, case-insensitive)
- `minPrice` - Minimum price filter (inclusive)
- `maxPrice` - Maximum price filter (inclusive)
- `numberOfEntries` - Filter by "Single" or "Multiple"
- `currency` - Currency code for price conversion (e.g., EUR, GBP). Defaults to USD.

**GET /api/visas/:id:**

- `currency` - Currency code for price conversion (e.g., EUR, GBP). Defaults to USD.

**Note:** Currency conversion is only available for GET endpoints. POST and PUT operations do not accept currency parameters.

### Currency Conversion

All visa prices are stored in USD. The API supports currency conversion using the `currency` query parameter on **GET endpoints only**:

- Currency conversion is available for `GET /api/visas` and `GET /api/visas/:id` endpoints
- If `CURRENCY_API_KEY` is configured, prices are converted to the requested currency
- If currency service is unavailable or not provided, the API returns only USD prices with a 503 error for non-USD requests
- **Write operations (POST/PUT) do not accept currency parameters** - all prices must be provided in USD, and responses are always returned in USD

## Application Files

### Core Application

- **`api/src/main.ts`** - Application entry point that initializes the server and dependencies
- **`api/src/app/app.ts`** - Express application factory that configures middleware, routes, and error handling
- **`api/src/app/types.ts`** - Core type definitions and domain models (Visa, DTOs, enums)
- **`api/src/app/errors.ts`** - Custom error classes for structured error handling

### Routes & Middleware

- **`api/src/app/routes/visas.routes.ts`** - REST API routes for visa operations with currency conversion
- **`api/src/app/middleware/async-handler.ts`** - Wrapper for async route handlers to catch errors
- **`api/src/app/middleware/error-handler.ts`** - Centralized error handling middleware
- **`api/src/app/middleware/rate-limiter.ts`** - Rate limiting middleware to prevent too many requests

### Services

- **`api/src/app/services/currency.service.ts`** - Currency conversion service that converts USD amounts to other currencies

### Data Layer

- **`api/src/app/data/visa.repository.ts`** - Repository interface abstracting visa data persistence
- **`api/src/app/data/sqlite.visa.repository.ts`** - SQLite implementation of the visa repository with in-memory caching for getAll queries
- **`api/src/app/data/currency.provider.ts`** - Interface for currency providers
- **`api/src/app/data/currency.provider.factory.ts`** - Factory for creating currency provider instances
- **`api/src/app/data/exchangerate-api.provider.ts`** - ExchangeRate-API v6 provider implementation with caching (uses https://www.exchangerate-api.com/)
- **`api/src/app/data/cache.ts`** - Generic in-memory cache implementation with TTL support (used for both currency rates and visa queries)

### Utilities & Configuration

- **`api/src/app/utils/visa.utils.ts`** - Utility functions for validation, currency conversion, and query parsing
- **`api/src/app/config/swagger.config.ts`** - Swagger/OpenAPI configuration for API documentation

### Test Files

- **`api-e2e/src/api/*.spec.ts`** - End-to-end tests for all visa API endpoints
- **`api-e2e/src/support/test-server.ts`** - Test server setup and teardown
- **`api-e2e/src/support/test-helpers.ts`** - Test utility functions
- **`api-e2e/src/support/test-setup.ts`** - Jest test configuration

## Data Files

The `db/` directory contains SQLite database files:

- **`db/visas.csv`** - Raw visa data directly taken from Sherpa's coding challenge (source data)
- **`db/visas.db`** - Production SQLite database (auto-created from master if missing)
- **`db/visas.test.db`** - Test SQLite database (auto-created and reset for each test run)
- **`db/visas.master.db`** - Master database copy (source of truth, never modified by the application)

The CSV file contains the original raw data from Sherpa's coding challenge. The application uses SQLite databases for persistence, which are automatically initialized from the master database on first run.

```
Country,Visa Type,Price (USD),Length of Stay (Days),Number of Entries,Filing Fee (USD)
USA,Tourist,160,90,Single,20
USA,Business,185,180,Multiple,25
USA,Student,350,730,Multiple,50
Canada,Tourist,100,180,Single,15
Canada,Business,150,365,Multiple,30
Canada,Student,200,1095,Multiple,40
UK,Tourist,130,180,Single,25
UK,Business,200,365,Multiple,35
UK,Student,450,1095,Multiple,55
France,Schengen,80,90,Single,10
Germany,Schengen,90,90,Multiple,12
Italy,Schengen,85,90,Single,11
Spain,Schengen,88,90,Multiple,13
Australia,Tourist,145,90,Single,18
Australia,Business,250,365,Multiple,40
Australia,Student,620,1095,Multiple,60
Japan,Tourist,30,90,Single,8
Japan,Business,55,180,Multiple,12
Japan,Student,100,730,Multiple,25
China,Tourist,140,90,Single,20
China,Business,185,180,Multiple,30
China,Student,250,1095,Multiple,45
India,Tourist,25,30,Single,5
India,Business,75,180,Multiple,10
India,Student,100,365,Multiple,20
Brazil,Tourist,40,90,Single,10
Brazil,Business,160,180,Multiple,25
Brazil,Student,200,730,Multiple,35
Russia,Tourist,50,30,Single,15
Russia,Business,150,180,Multiple,25
Russia,Student,250,1095,Multiple,40
UAE,Tourist,90,30,Single,10
UAE,Business,120,180,Multiple,15
UAE,Student,250,1095,Multiple,35
Mexico,Tourist,36,180,Single,8
Mexico,Business,100,365,Multiple,20
Mexico,Student,200,1095,Multiple,30
South Africa,Tourist,50,90,Single,12
South Africa,Business,125,180,Multiple,18
South Africa,Student,200,1095,Multiple,30
Argentina,Tourist,150,90,Single,15
Argentina,Business,180,180,Multiple,25
Argentina,Student,250,1095,Multiple,35
Thailand,Tourist,35,60,Single,5
Thailand,Business,75,180,Multiple,10
Thailand,Student,175,730,Multiple,25
Vietnam,Tourist,25,30,Single,5
Vietnam,Business,50,180,Multiple,12
Vietnam,Student,150,730,Multiple,20
```

**Note:** The above data is sourced directly from Sherpa.

## Architecture & Design Decisions

### Focus Areas

This project focuses on RESTful API design and documentation, robust TypeScript (using Node and Express), e2e testing, as well as use of design patterns and abstraction for future scaling and if actual production databases or other 3rd party currency APIs are added. I chose to focus on these areas to highlight my skills and strengths. I aim to show that this demo project is extensible and scalable.

### Key Architectural Decisions

**RESTful API Design & Documentation:** REST principles with OpenAPI/Swagger documentation for easy integration and testing. Chosen because REST is the most common standard and Swagger provides interactive API exploration. Furthermore, the Visa data did not have too many fields for something like GraphQL to make sense.

**End-to-End Testing:** Comprehensive e2e tests covering all endpoints. Validates the entire request/response cycle from a client's perspective, ensuring all components work together correctly. More useful for an API than ordinary unit tests. Although in a production app, you would likely have both e2e and unit tests.

**Repository Design Pattern:** All database operations go through the `VisaRepository` interface, which hides the underlying database implementation. Currently using SQLite (`SqliteVisaRepository`), but this can be swapped for PostgreSQL or MySQL by creating a new implementation. The rest of the application doesn't need to change because it only depends on the interface.

**Adapter & Factory Patterns for Currency API:** The `CurrencyProvider` interface defines a standard way to get exchange rates. The `ExchangeRateApiProvider` adapts the ExchangeRate-API service to match this interface. The `createCurrencyProvider` factory function creates the right provider based on configuration. To switch to a different currency API (like Fixer.io), just add a new adapter and update the configuration—no code changes needed elsewhere.

**Layered Architecture:** Clear separation between routes, services, data access, and utilities ensures maintainability and testability.

**Error Handling:** Custom error classes (`AppError`, `ValidationError`, `NotFoundError`, etc.) provide structured error handling with appropriate HTTP status codes and detailed error messages.

**Caching:** The generic `Cache<T>` class provides in-memory caching with configurable TTL for both currency exchange rates and visa query results. Currency exchange rates are cached to minimize API requests (default TTL: 1 day). Visa repository caches unfiltered `getAll()` queries to reduce database load, with automatic cache clearing on mutations (POST/PUT/DELETE requests). All caching is in-memory during an individual session. For production, Redis-based distributed caching could be used.

**API Rate Limiting:** Rate limiting is already implemented using `express-rate-limit` with configurable limits. For a production app, I could also use Redis for rate limiting.

### Scaling Considerations

**More Users:** I would deploy multiple API instances to handle more requests and add a load balancer to balance requests between instances.

**More Data:** I would add database indexes on frequently queried fields (`country`, `visaType`, `price`). I would implement Redis caching for popular queries.

### Future Improvements

**Database Migration:** Replace SQLite with PostgreSQL or MySQL for production use, taking advantage of the existing repository abstraction.

**Enhanced Caching and Rate Limiting:** Implement Redis-based distributed caching for exchange rates and frequently accessed visa data to improve performance and reduce database load. Redis can provide in-memory caching as well as potential data persistence and distributed caching across multiple server instances. Redis can also provide rate-limiting.

**Authentication & Authorization:**

For a standalone public API, clients could register and receive API keys to include with their requests. The API validates these keys on each request to ensure only authorized clients can access the data.

When part of a larger application, users can log in through the frontend (login validation with services like Firebase). The frontend receives a token or session that gets sent with each API request. The backend can validate this token to identify the user and determine what they're allowed to do. This is just one option for a full-stack application with a login system.

**API Versioning:** Potentially implement API versioning (e.g., `/api/v1/visas`) to support backwards compatibility as the API evolves.

**Comprehensive Testing:** Expand test coverage with unit tests for services and utilities, integration tests for database operations, and performance tests for load scenarios. And with more serious databases and services, our e2e tests would be more useful in actually testing the entire application end-to-end with more components involved.

**CI/CD Pipeline:** Set up continuous integration and deployment pipelines with automated testing, code quality checks, and deployment automation. I would likely use Github Actions.

**Monitoring & Observability:** Add logging and metrics services for production monitoring. It's important to monitor the number of successful/failed requests, as well as why requests fail.

**Data Standards:** One assumption made for this demo project is that the provided data serves as a data standard or schema to which only IDs were added. One improvement would be to use ISO codes for countries instead of string names, since many countries have multiple string representations (e.g., 'UK', 'United Kingdom', 'United Kingdom of Great Britain and Northern Ireland'). This would improve data consistency, enable better internationalization, and reduce ambiguity.
