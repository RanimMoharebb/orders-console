# Orders Console

A full-stack order management application built with React, TypeScript, Node.js, Express, Prisma, and SQLite. It supports server-side order search, filtering, sorting, pagination, and validated order creation with idempotency protection.

### Demo Video

[▶ Watch the Orders Console Demo](docs/Website%20Demo.mp4)

### Application Screenshots

**Login Page**

![Orders Console Login Page](docs/Website%20Screenshots/1-login-page.png)

**Agent Dashboard**

![Orders Console Agent Dashboard](docs/Website%20Screenshots/2-agent-dashboard.png)

**Administrator Dashboard**

![Orders Console Administrator Dashboard](docs/Website%20Screenshots/3-admin-dashboard.png)

---


## Table of Contents


1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Setup](#setup)
5. [Demo Accounts](#demo-accounts)
6. [API Overview](#api-overview)
7. [Performance and Stale Requests](#performance-and-stale-requests)
8. [Testing](#testing)
9. [Code Review Task](#code-review-task)
10. [Product Question: Deleting All Cancelled Orders](#product-question-deleting-all-cancelled-orders)
11. [What I Skipped and Why](#what-i-skipped-and-why)
12. [Known Scope and Production Considerations](#known-scope-and-production-considerations)
13. [AI Tool Disclosure](#ai-tool-disclosure)




## Technology Stack

**Frontend:** React · TypeScript · Vite · CSS

**Backend:** Node.js · Express · TypeScript · Prisma ORM · SQLite · Zod · JWT · bcryptjs


## Project Structure

```text
orders-console/
├── client/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── CreateOrderModal.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DeleteCancelledOrdersModal.tsx
│   │   │   └── Login.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   │   ├── 20261020145526_init/
│   │   │   │   └── migration.sql
│   │   │   ├── migration_lock.toml
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── lib/
│   │   │   ├── jwt-config.ts
│   │   │   └── prisma.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── validate.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   └── orders.routes.ts
│   │   ├── schemas/
│   │   │   ├── auth.schema.ts
│   │   │   ├── order.schema.ts
│   │   │   └── order-query.schema.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── order.service.ts
│   │   │   ├── order-list.service.ts
│   │   │   └── order-management.service.ts
│   │   ├── types/
│   │   │   └── express.d.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── admin-deletion.test.ts
│   │   ├── authorization.test.ts
│   │   ├── idempotency.test.ts
│   │   └── require-admin.test.ts
│   ├── package.json
│   ├── prisma.config.ts
│   └── tsconfig.json
orders-console/
├── docs/
│   ├── Postman Tests Screenshots/
│   │   ├── 1- Login/
│   │   ├── 2- List Order/
│   │   ├── 3- Create order/
│   │   ├── 4- Search order/
│   │   └── 5- Delete cancelled orders/
│   ├── Terminal Tests Screenshots/
│   ├── Website Screenshots/
│   └── Website Demo.mp4
├── .env.example
├── DECISIONS.md
└── README.md
```


## Prerequisites

* **Node.js and npm:** Versions compatible with the project dependencies.
* **Git:** Required if cloning the repository.
* **Terminal:** PowerShell or another terminal.

## Setup

Run the commands below from the repository root unless otherwise indicated.

### 1. Configure the environment

Create `server/.env` using `.env.example` as a reference.

The server requires the following environment variables:

| Variable       | Purpose                                                                            |
| -------------- | ---------------------------------------------------------------------------------- |
| `DATABASE_URL` | SQLite database connection string                                                  |
| `PORT`         | Backend port; defaults to `3000` if not configured                                 |
| `JWT_SECRET`   | Secret used to sign and verify JWTs; use a strong secret of at least 32 characters |

Generate a strong local JWT secret in PowerShell:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
$rng.Dispose()
$secret
```

Copy the generated value into `server/.env` as `JWT_SECRET`.


### 2. Install backend dependencies

From the repository root:

```powershell
Set-Location .\server
npm install
```

### 3. Create the database

From the `server` directory:

```powershell
npm run db:migrate
```

This applies the Prisma database migrations.

### 4. Seed the database

From the `server` directory:

```powershell
npm run db:seed
```

The seed script creates the demo users and 50,000 sample orders, including order items.

**Warning:** The seed script clears existing idempotency records, order items, and orders before recreating the sample data. Do not run it against data you need to preserve.

### 5. Start the backend

From the `server` directory:

```powershell
npm run dev
```

Keep this terminal running.

### 6. Install frontend dependencies

Open a second terminal and navigate to the repository root:

```powershell
Set-Location .\client
npm install
```

### 7. Start the frontend

From the `client` directory:

```powershell
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.


## Demo Accounts

The seed script creates the following local demo accounts:

| Role  | Email               | Password    |
| ----- | ------------------- | ----------- |
| Admin | `admin@example.com` | `Admin123!` |
| Agent | `agent@example.com` | `Agent123!` |


Both accounts can authenticate and access the order-list and order-creation endpoints.

The `DELETE /api/orders/cancelled` endpoint is restricted to administrators through server-side authentication and role checks.






## API Overview

The backend exposes a REST API for authentication and order management. Protected endpoints require a valid JWT access token in the `Authorization` header.

| Application Feature     | Method   | Endpoint                | Authentication | Description                                                                   |
| ----------------------- | -------- | ----------------------- | -------------- | ----------------------------------------------------------------------------- |
| Login                   | `POST`   | `/api/auth/login`       | Not required   | Authenticates a user and returns a JWT access token.                          |
| Search and View Orders  | `GET`    | `/api/orders`           | Required       | Retrieves orders with server-side search, filtering, sorting, and pagination. |
| Create Order            | `POST`   | `/api/orders`           | Required       | Creates an order after validating the request and enforcing idempotency.      |
| Delete Cancelled Orders | `DELETE` | `/api/orders/cancelled` | Admin only     | Deletes all cancelled orders.                                                 |






## Performance and Stale Requests

The application uses server-side page-based pagination so the browser does not need to download or process the entire dataset.

Database indexes support relevant customer, status, date, amount, and relationship query patterns. Index effectiveness depends on the database query and search pattern; conventional indexes may not accelerate every substring search.

The frontend uses `AbortController` and React effect cleanup to prevent obsolete requests from updating the dashboard after newer search, filter, sorting, or pagination parameters have been selected.







## Testing

The application was tested using automated backend tests, manual API requests through Postman, and frontend build and lint checks.

### Automated Backend Tests

Run the following commands from the `server` directory. The HTTP integration tests require the backend to be running.

#### 1. Idempotency Tests

```powershell
npm run test:idempotency
```

| Scenario                                             | Result                                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 10 concurrent requests with the same key and payload | Passed — 10 HTTP `201` responses, one unique order ID, and one idempotency record. |
| Retry with the same key and payload                  | Passed — returns the existing order.                                               |
| Reuse a key with a different payload                 | Passed — HTTP `409 Conflict`; order count unchanged.                               |

#### 2. Authorization Tests

```powershell
npm run test:authorization
```

| Scenario                                       | Result                            |
| ---------------------------------------------- | --------------------------------- |
| Delete cancelled orders without authentication | Passed — HTTP `401 Unauthorized`. |
| Agent attempts to delete cancelled orders      | Passed — HTTP `403 Forbidden`.    |
| Agent accesses the order list                  | Passed — HTTP `200 OK`.           |

#### 3. Administrator Middleware Tests

```powershell
npm run test:admin-middleware
```

| Scenario                              | Result                     |
| ------------------------------------- | -------------------------- |
| Request without an authenticated user | Passed — request rejected. |
| User with the `AGENT` role            | Passed — request rejected. |
| User with the `ADMIN` role            | Passed — request allowed.  |

#### 4. Administrator Deletion Tests

```powershell
npm run test:admin-deletion
```

This test must run against an isolated test database. Both the backend server and the test process must use the same isolated database.

| Scenario                                  | Result                      |
| ----------------------------------------- | --------------------------- |
| Administrator deletes a cancelled order   | Passed — HTTP `200 OK`.     |
| Verify deletion count                     | Passed — `deletedCount: 1`. |
| Verify the order no longer exists         | Passed.                     |
| Verify associated order items are deleted | Passed.                     |

**Test Data and Safety:** The idempotency tests create orders and idempotency records in the database used by the test process. The authorization tests verify access permissions without intentionally deleting orders. The administrator deletion test creates a temporary cancelled order in an isolated database, deletes it through the API, and verifies that the order and its associated items are removed.

The administrator deletion endpoint deletes all cancelled orders in the database to which the backend is connected. Therefore, the deletion test uses an isolated database to avoid affecting seeded development data. Never run destructive API requests against production data.

Reseeding the development database resets existing order data and idempotency records.


**Test Evidence:** Screenshots of automated backend tests and database seeding are available in `docs/Terminal Tests Screenshots/`.



### 2. Manual API Testing with Postman

Postman was used to test authentication, order listing and search, order creation, idempotency, and administrator authorization.

#### 2.1 Authentication — `POST /api/auth/login`

| Test Case                                  | Expected Result    |
| ------------------------------------------ | ------------------ |
| Login with valid administrator credentials | `200 OK`           |
| Login with valid agent credentials         | `200 OK`           |
| Invalid email format                       | `400 Bad Request`  |
| Incorrect password                         | `401 Unauthorized` |
| Nonexistent email                          | `401 Unauthorized` |
| Missing email                              | `400 Bad Request`  |
| Missing password                           | `400 Bad Request`  |
| Missing email and password                 | `400 Bad Request`  |

Successful login returns a JWT for authenticated requests.

#### 2.2 List and Search Orders — `GET /api/orders`

| Test Case                     | Expected Result    |
| ----------------------------- | ------------------ |
| Request without a token       | `401 Unauthorized` |
| Request with an invalid token | `401 Unauthorized` |
| Request with a valid token    | `200 OK`           |
| `pageSize=1`                  | `200 OK`           |
| `pageSize=100`                | `200 OK`           |
| `pageSize=0`                  | `400 Bad Request`  |
| `pageSize=999`                | `400 Bad Request`  |
| `pageSize=3.5`                | `400 Bad Request`  |
| `pageSize=ab`                 | `400 Bad Request`  |

The endpoint supports server-side search, status filtering, sorting, and pagination.

#### 2.3 Create Orders — `POST /api/orders`

| Test Case                                     | Expected Result                               |
| --------------------------------------------- | --------------------------------------------- |
| Request without a token                       | `401 Unauthorized`                            |
| Request without an idempotency key            | `400 Bad Request`                             |
| Create an order with valid data and a new key | `201 Created`                                 |
| Submit the same order with a different key    | `201 Created`; a new order is created         |
| Retry with the same key and payload           | `201 Created`; the existing order is returned |
| Reuse the same key with a different payload   | `409 Conflict`                                |

Idempotency prevents duplicate orders when a request is retried with the same key and payload.

#### 2.4 Delete Cancelled Orders — `DELETE /api/orders/cancelled`

| Test Case                                                            | Expected Result                  |
| -------------------------------------------------------------------- | -------------------------------- |
| Request without a token                                              | `401 Unauthorized`               |
| Request with an invalid token                                        | `401 Unauthorized`               |
| Request with a valid administrator token when cancelled orders exist | `200 OK`                         |
| Administrator request when no cancelled orders exist                 | `200 OK`, with `deletedCount: 0` |
| Request with a valid agent token                                     | `403 Forbidden`                  |

Administrator deletion was also verified by creating a temporary cancelled order and confirming that the order and its associated items were deleted.


#### Postman Evidence

Screenshots of the Postman requests and responses are included in `docs/Postman Tests Screenshots/`.

The screenshots cover:

* Authentication and login validation.
* Order listing, pagination, and query validation.
* Order creation and idempotency.
* Authorization and cancelled-order deletion.



### 3. Build and Lint Checks

Run the backend build from the `server` directory:

```powershell
npm run build
```

Run the frontend checks from the `client` directory:

```powershell
npm run build
npm run lint
```

The backend and frontend builds check that their respective codebases compile successfully. The frontend lint command checks for linting issues.



## Code Review Task

The order-list and order-creation endpoints require authentication. The server verifies JWT signatures, restricts the accepted algorithm, validates the issuer and audience, checks token expiration, and loads the authenticated user from the database. Passwords are stored as bcrypt hashes and verified using `bcrypt.compare()`. Incoming order data is validated on the server, and idempotency is enforced server-side.

### Problems Found and Fixes

| Problem                                                  | Fix                                                                                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Hardcoded JWT secret                                     | Load the secret from an environment variable and reject missing or insufficiently strong secrets. |
| Using `jwt.decode()` without verifying token signatures  | Use `jwt.verify()` with the expected algorithm, issuer, and audience.                             |
| Tokens accepted through URL query parameters             | Accept authentication tokens through the `Authorization` header only.                             |
| Administrator authorization handled only by the frontend | Enforce administrator permissions on the server using `requireAdmin` middleware.                  |
| Plaintext password comparison                            | Store bcrypt password hashes and verify them using `bcrypt.compare()`.                            |
| Missing login input validation                           | Validate login fields on the server using Zod before processing the request.                      |
| No explicit token expiration when signing JWTs           | Configure token expiration when issuing JWTs.                                                     |

### Authorization

Both Admin and Agent users can access the order-list and order-creation endpoints when authenticated. The cancelled-order deletion endpoint additionally requires the `ADMIN` role.

Authorization tests verify that:

* Unauthenticated deletion requests receive `401 Unauthorized`.
* Agent deletion requests receive `403 Forbidden`.
* Admin requests pass the administrator authorization middleware.

### Token Storage Trade-offs

The access token is stored in `sessionStorage`, allowing the user to remain logged in after refreshing the page while limiting persistence to the current browser tab's session. The user's role is stored alongside the token so the frontend can display role-specific actions after a refresh.

Because `sessionStorage` is accessible to JavaScript, an XSS vulnerability could expose the token. An alternative is an `HttpOnly`, `Secure`, `SameSite` cookie, which prevents JavaScript from directly reading the token but requires appropriate cookie configuration and consideration of cross-site request forgery (CSRF) protections.


### Administrator Deletion Feature

The application includes an administrator-only endpoint that permanently deletes all orders with the `CANCELLED` status. Server-side role authorization protects this operation, but permanent bulk deletion should only be used with a confirmed retention policy and appropriate safeguards against accidental data loss.




## Product Question: Deleting All Cancelled Orders

Before deleting cancelled orders, I would ask why the operations team needs this and clarify any legal, audit, refund, or reporting retention requirements. If the requirements remain unclear, I would avoid permanent deletion and recommend hiding or archiving the records instead. If cancelled orders are no longer needed for the business and there are no retention requirements, permanent deletion without soft deletion may be appropriate. Otherwise, I would consider soft deletion with a restore option. Any bulk deletion should have a confirmed scope, administrator-only server-side authorization, and safeguards against accidental data loss.




## What I Skipped and Why

* **O1 — Slow Stats API:** Prioritized the required order-list functionality, server-side filtering and pagination, and reliable order creation over the optional statistics endpoint.

* **O2 — Optimistic Create:** The interface relies on the server response as the source of truth. This avoids additional optimistic-update and rollback logic.

* **Alternative Deletion Strategies:** I considered three approaches to cancelled-order management: archiving orders, soft-deleting orders into a recently deleted area, and permanently deleting orders. Due to the time constraint, I implemented permanent deletion only, protected by administrator authorization. Archiving and soft deletion with a recovery option remain potential improvements.

* **Cursor-Based Pagination:** Implemented server-side page-based pagination, which satisfies the listing requirement without adding cursor-based pagination.

* **Production Deployment and Operational Hardening:** This assessment focuses on the requested application behavior. Production deployment, rate limiting, monitoring, and additional operational controls would require further work.

* **Senior Design Memo:** A separate `SCALE.md` design memo was not included because this is a Junior-level assessment. The main technical trade-offs are documented in `DECISIONS.md`.


## AI Tool Disclosure

ChatGPT was used for implementation guidance, debugging, and documentation support. Claude was used to review the code and identify potential issues. The implementation was verified through local builds, manual API/UI checks, and automated idempotency and authorization tests. 




## Known Scope and Production Considerations

This is an assessment implementation, not a production deployment.

Before production use, further work would include:

* HTTPS and secure deployment configuration.
* Production-grade secret management and environment configuration.
* Appropriate rate limiting and operational monitoring.
* A defined token lifecycle and storage strategy.
* Additional server-side role-based authorization for future endpoints that introduce administrative restrictions.
* Broader automated tests, including additional authentication, authorization, validation, and error-handling cases.
* A documented backup, recovery, and data-retention strategy.



































