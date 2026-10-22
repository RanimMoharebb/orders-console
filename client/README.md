# Orders Console — Frontend

## Overview

The frontend is a React application built with TypeScript and Vite. It provides the user interface for authentication and order management.

The application communicates with the Express backend through HTTP requests. It supports viewing, searching, filtering, sorting, and paginating orders, as well as creating orders and providing an administrator interface for deleting cancelled orders.

## Technology Stack

* React 19
* TypeScript
* Vite
* Vanilla CSS
* Fetch API with unified HTTP client abstraction

## Project Structure

```text
client/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/
│   │   └── apiClient.ts
│   ├── components/
│   │   ├── common/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── Modal.tsx
│   │   ├── orders/
│   │   │   ├── OrdersFilters.tsx
│   │   │   ├── OrdersPagination.tsx
│   │   │   └── OrdersTable.tsx
│   │   ├── CreateOrderModal.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DeleteCancelledOrdersModal.tsx
│   │   └── Login.tsx
│   ├── hooks/
│   │   ├── useBodyScrollLock.ts
│   │   ├── useDebounce.ts
│   │   └── useOrders.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── formatters.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Architecture

The frontend follows modular component architecture, the Single Responsibility Principle (SRP), and clean separation of concerns.

### Application Entry Point

* `main.tsx` initializes the React application and mounts it in the browser inside React StrictMode.
* `App.tsx` is the root component wrapped in an `ErrorBoundary`. It manages session persistence via `sessionStorage` and conditionally renders `Login` or `Dashboard`.
* `App.css` and `index.css` contain design tokens, layout definitions, responsive rules, and component styles.

### Core Modules

**api/apiClient.ts**

Centralized HTTP client wrapping `fetch` with strict typing. Handles:
* Automatic `Authorization: Bearer <token>` header injection.
* Optional `Idempotency-Key` header injection.
* Centralized 401 session expiration callback.
* Non-JSON response fallback and parsing safety.
* Extraction of Zod validation details into human-readable messages.

**components/common/ErrorBoundary.tsx**

Class-based error boundary that intercepts uncaught render exceptions, prevents white-screen crashes, displays user-friendly recovery instructions, and provides a "Reload Console" action.

**components/common/Modal.tsx**

Accessible dialog shell with `Escape` key listeners, backdrop dismissal, ARIA attributes (`aria-modal="true"`, `role="dialog"` or `role="alertdialog"`), and background scroll lock integration.

**components/orders/OrdersFilters.tsx**

Dedicated presentation component for search query inputs, order status dropdowns, and column sorting selectors.

**components/orders/OrdersTable.tsx**

Renders the orders table, customer initials avatars, status badges, tabular-aligned currency cells, and formatted timestamps. Manages loading spinners and empty search states.

**components/orders/OrdersPagination.tsx**

Provides page navigation buttons, rows-per-page selection (10, 25, 50, 100), and records counter display.

**components/Dashboard.tsx**

Orchestrator component connecting `useOrders` state to the filters, table, and pagination components, as well as coordinating the order creation and cancellation deletion modals.

**components/CreateOrderModal.tsx**

Provides the form for creating a new order with dynamic multi-item rows, client-side input validation, real-time total price calculation, and UUID-based idempotency key generation.

**components/DeleteCancelledOrdersModal.tsx**

Administrator confirmation dialog for permanently removing cancelled orders from the database.

**components/Login.tsx**

Authentication form that submits user credentials to `/api/auth/login` and validates the returned token and user role.

### Custom Hooks

* `useOrders.ts`: Encapsulates server-side query state (page, pageSize, debounced search, status, sort), data fetching, request cancellation via `AbortController`, and refresh triggers.
* `useDebounce.ts`: Debounces user search queries (300ms) to prevent network flooding and unnecessary database queries while typing.
* `useBodyScrollLock.ts`: Safely locks `document.body.style.overflow` when modals are active with reference counting.

### Shared Utilities & Types

* `utils/formatters.ts`: Reusable, centralized instances of `Intl.NumberFormat` (`formatCurrency`) and `Intl.DateTimeFormat` (`formatDate`).
* `types/index.ts`: Strong TypeScript contracts covering orders, pagination metadata, API response envelopes, error structures, user roles, and form inputs.

## Data Flow

1. User actions in components trigger query state changes in `useOrders`.
2. Input changes (like search) are debounced by `useDebounce` before firing network requests.
3. Requests are executed through `apiClient.request<T>` with active `AbortController` cancellation for superseded requests.
4. If a request returns `401 Unauthorized`, the session is automatically terminated and the user is redirected to Login.
5. Successful responses update local state and are presented through decomposed UI components.

## Authentication & Persistence

* After a successful login, the access token and user role are stored in `sessionStorage`.
* Active sessions persist across tab refreshes within the same browser session.
* Calling `onLogout()` or receiving an HTTP 401 clears `sessionStorage` and resets application state.
* Authorization rules are enforced strictly on the backend.

## Development

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Run lint checks:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Run these commands from the `client/` directory.
