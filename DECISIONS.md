# Technical Decisions

## 1. R1 — Server-Side Pagination and Indexed Queries

**Decision:** Perform order search, status filtering, sorting, and page-based pagination on the server, with database indexes for relevant query patterns.

**Alternative:** Load all 50,000+ orders into the browser and process the dataset in React, potentially using virtualization to reduce the number of visible DOM elements.

**Why rejected:** Virtualization reduces rendering costs but does not eliminate the network transfer, browser memory usage, and client-side processing required to load the entire dataset. Server-side pagination returns only the requested page and lets the database handle filtering and sorting. Page-based pagination satisfies the current requirements without the additional complexity of cursor-based pagination. Conventional indexes may not accelerate substring searches, so their presence does not guarantee that every search will be fast.

## 2. R2 — Database-Enforced Idempotency

**Decision:** Require an `Idempotency-Key`, store a hash of the request payload and the resulting order association, and enforce key uniqueness in the database.

**Alternative:** Check for an existing idempotency key in application code before creating an order, without a database uniqueness constraint.

**Why rejected:** Concurrent requests could both pass an application-level existence check before either creates an order. Database-enforced uniqueness protects against this race, while the request hash detects attempts to reuse a key with a different payload. The automated test sent ten concurrent requests and confirmed that only one order was created for the shared idempotency key. Sequential retries returned the existing order, and conflicting payloads received HTTP 409.

**Limitations:** Clients must reuse the same key when retrying the same logical operation. A new key for every retry is treated as a separate operation. Idempotency records must be retained for the required retry window; deleting them can remove the protection those records provide.

## 3. JWT Authentication and Server-Side Authorization

**Decision:** Verify signed JWT bearer tokens using the expected algorithm, issuer, audience, and expiration, then load the current user and role from the database. Keep the signing secret in environment configuration. Protect the cancelled-order deletion endpoint with both `requireAuth` and `requireAdmin`.

**Alternative:** Store authorization roles in frontend state and rely on client-side route protection, or trust role information supplied by the client without independently verifying it on the server.

**Why rejected:** Client-side checks can be bypassed by calling the API directly. JWT verification protects token integrity, while database lookup ensures authorization uses the current account role. The deletion endpoint enforces the administrator role on the server. Authorization tests confirmed HTTP 401 for unauthenticated deletion attempts, HTTP 403 for agent attempts, and successful passage through the middleware for an administrator role.

**Limitations:** The administrator deletion operation permanently deletes all orders with a `CANCELLED` status. Because deleted records are not recoverable through the application, the operation should be used carefully. Production use would require appropriate audit, retention, and recovery safeguards.

## AI Tool Disclosure

ChatGPT was used for implementation guidance, debugging, and documentation support. Claude was used to review the code and identify potential issues.

Google Antigravity was used for the last two major refactors in the project:
1. **Frontend Refactoring & UI Alignment**: Modularizing the monolithic Dashboard into single-responsibility components (`OrdersFilters`, `OrdersTable`, `OrdersPagination`), adding custom hooks (`useOrders`, `useDebounce`, `useBodyScrollLock`), an accessible `Modal` component, a top-level `ErrorBoundary`, a unified typed `apiClient` with automatic JWT handling and error parsing, aligning action buttons precisely with design screenshots, and removing unused assets.
2. **Backend Refactoring & Clean Architecture**: Introducing a centralized configuration layer (`config/env.ts`), a dedicated controllers layer (`auth.controller.ts`, `orders.controller.ts`), a standardized HTTP error hierarchy (`errors/http-errors.ts`), and global error/404 handling middleware (`error.middleware.ts`) to eliminate route try/catch boilerplate and guarantee consistent JSON responses.

The implementation was verified through local builds, manual API/UI checks, and automated idempotency and authorization tests.

