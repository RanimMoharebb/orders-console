# Orders Console — Backend

## Overview

The backend is a REST API built with Node.js, Express, and TypeScript. It uses Prisma ORM with SQLite for data persistence.

It handles authentication, order retrieval, order creation, request validation, idempotency, and administrator-only deletion of cancelled orders.

## Technology Stack

* Node.js
* Express
* TypeScript
* Prisma ORM
* SQLite
* Zod for request validation
* JSON Web Tokens (JWT) for authentication
* bcryptjs for password hashing

## Project Structure

```text
server/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── orders.controller.ts
│   ├── errors/
│   │   └── http-errors.ts
│   ├── lib/
│   │   ├── jwt-config.ts
│   │   └── prisma.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validate.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── orders.routes.ts
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   ├── order.schema.ts
│   │   └── order-query.schema.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── order.service.ts
│   │   ├── order-list.service.ts
│   │   └── order-management.service.ts
│   ├── types/
│   │   └── express.d.ts
│   ├── app.ts
│   └── server.ts
├── tests/
├── package.json
└── tsconfig.json
```

## Architecture

The backend separates configuration, routing, controllers, request validation, authentication, application logic, and database access.

A typical request follows this flow:

1. The request reaches an Express route in `routes/`.
2. Applicable middleware in `middleware/` performs authentication and request validation.
3. The route delegates execution to a controller in `controllers/`.
4. The controller invokes the relevant service in `services/`.
5. The service performs the required application operation using Prisma.
6. Handlers return structured JSON responses, and any thrown `HttpError` is caught by `error.middleware.ts` for uniform error serialization.

The exact flow depends on the endpoint. Public login requests do not require an authenticated user, while protected order operations require authentication. Cancelled-order deletion additionally requires administrator authorization.

## Application Entry Points

**`server.ts`**

Starts the HTTP server and listens on the configured port.

**`app.ts`**

Configures the Express application and its middleware and routes.

## Routes

### `routes/auth.routes.ts`

Defines the authentication endpoint:

* `POST /api/auth/login` — validates login input and processes authentication.

### `routes/orders.routes.ts`

Defines the order endpoints:

* `GET /api/orders` — retrieves orders using server-side search, filtering, sorting, and pagination.
* `POST /api/orders` — validates and creates an order with idempotency protection.
* `DELETE /api/orders/cancelled` — permanently deletes cancelled orders and requires administrator authorization.

## Middleware

### `auth.middleware.ts`

Verifies bearer JWTs, including the signature, accepted algorithm, issuer, audience, and expiration. It then loads the authenticated user from the database.

Administrator-only operations also require the appropriate role.

### `validate.middleware.ts`

Provides request-validation middleware used by the routes. The relevant schemas define the accepted request input.

## Validation Schemas

The `schemas/` directory contains Zod schemas for authentication, order creation, and order-list query parameters.

Separating validation schemas from route handlers makes request requirements easier to maintain and test.

## Services

The `services/` directory contains the application logic.

* **`auth.service.ts`** handles authentication-related operations, including credential verification and token creation.
* **`order-list.service.ts`** handles order-list retrieval and its query operations.
* **`order.service.ts`** contains order-related business logic, including creation and idempotency handling where implemented.
* **`order-management.service.ts`** handles order-management operations, including cancelled-order deletion where implemented.

The service files divide responsibilities so that the route handlers do not need to contain all the application's business logic.

## Database and Prisma

### `prisma/schema.prisma`

Defines the database models, fields, relationships, and indexes.

### `prisma/migrations/`

Contains version-controlled database migration history.

### `prisma/seed.ts`

Creates the demo users and sample order dataset used for local development and assessment testing.

**Important:** Review the seed script before running it against a database containing data you want to preserve. The current seed process clears existing order-related data and idempotency records before reseeding.

## Authentication and Authorization

The API uses signed JWT bearer tokens for authentication.

The backend verifies token integrity and relevant claims before identifying the authenticated user. Passwords are stored as bcrypt hashes rather than plaintext.

Authentication and authorization are separate responsibilities:

* Authentication determines which user is making the request.
* Authorization determines whether that user is permitted to perform the operation.

Order-list and order-creation endpoints require authentication. Cancelled-order deletion additionally requires the administrator role.

These checks are performed on the server and do not depend solely on frontend restrictions.

## Idempotent Order Creation

Order creation requires an `Idempotency-Key`.

The backend associates the key with a request hash and the resulting order, with database uniqueness enforcement to protect against duplicate processing.

* Retrying the same operation with the same key and payload returns the existing result.
* Reusing the same key with a different payload returns HTTP 409 Conflict.
* Database constraints help prevent concurrent requests from creating duplicate orders for the same key.

Automated tests cover concurrent requests, sequential retries, and conflicting payloads.

## Order Listing and Performance

Order search, status filtering, sorting, and pagination are processed by the backend.

The API returns only the requested page instead of sending the entire dataset to the browser. Database indexes support relevant query patterns.

Conventional database indexes may not accelerate every substring-search query. If search performance becomes a bottleneck as the dataset grows, a dedicated search strategy may be needed.

## Automated Tests

The `tests/` directory contains tests for:

* Idempotent order creation.
* Order endpoint authentication and authorization.
* Administrator middleware.
* Cancelled-order deletion.

See the root README for the test commands and the conditions required to run the integration tests.

## Development

Install dependencies:

```bash
npm install
```

Apply database migrations:

```bash
npm run db:migrate
```

Seed the development database:

```bash
npm run db:seed
```

Start the backend development server:

```bash
npm run dev
```

Run the configured tests:

```bash
npm run test:idempotency
npm run test:authorization
npm run test:admin-middleware
npm run test:admin-deletion
```

Build the backend:

```bash
npm run build
```

Run these commands from the `server/` directory. Some integration tests require the backend server to be running and the database to be migrated and seeded.

Refer to the root README for environment configuration, demo accounts, and complete setup instructions.
