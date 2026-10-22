# Orders Console — Frontend

## Overview

The frontend is a React application built with TypeScript and Vite. It provides the user interface for authentication and order management.

The application communicates with the Express backend through HTTP requests. It supports viewing, searching, filtering, sorting, and paginating orders, as well as creating orders and providing an administrator interface for deleting cancelled orders.

## Technology Stack

* React
* TypeScript
* Vite
* CSS
* Fetch API for HTTP communication

## Project Structure

```text
client/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── CreateOrderModal.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DeleteCancelledOrdersModal.tsx
│   │   └── Login.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Architecture

The frontend is organized around React components, with each component responsible for a specific part of the interface.

### Application Entry Point

* `main.tsx` initializes the React application and mounts it in the browser.
* `App.tsx` is the root application component and coordinates the main application view.
* `App.css` and `index.css` contain application and global styling.

### Components

**Login.tsx**

Provides the login interface and submits credentials to the backend. After successful authentication, the application uses the returned access token for protected API requests.

**Dashboard.tsx**

Displays and manages the order list. It handles the order-list interface, search and filter controls, sorting, pagination, and the actions available to the authenticated user.

Order-list requests use server-side pagination and filtering rather than loading the entire dataset into the browser. Request cleanup and cancellation help prevent outdated requests from replacing newer results.

**CreateOrderModal.tsx**

Provides the form for creating an order. Client-side validation helps users correct input before submission, while the backend remains responsible for validating the request and enforcing idempotency.

**DeleteCancelledOrdersModal.tsx**

Provides the confirmation interface for the administrator's cancelled-order deletion action. The backend independently checks administrator authorization before performing the deletion.

### Shared Types

`types/index.ts` contains shared TypeScript definitions used by the frontend components.

These definitions improve consistency when handling order data, API responses, and other shared application data.

## Data Flow

The frontend communicates with the backend through HTTP requests.

1. The user interacts with a React component.
2. The component sends a request to the appropriate API endpoint.
3. The backend authenticates and validates the request where required.
4. The backend processes the operation and returns a response.
5. The frontend updates its interface based on the response.

The frontend does not load all 50,000 orders at once. It requests the page and filters needed for the current view.

## Authentication

After a successful login, the frontend retains the access token in React application state and sends it in the `Authorization: Bearer <token>` header for protected requests.

The token is not persisted in local storage or session storage. Consequently, refreshing the page clears the in-memory authentication state and requires the user to log in again.

Frontend route and UI checks improve the user experience, but authorization is enforced by the backend.

## Validation and Error Handling

The frontend can validate form input before sending requests and display errors returned by the API.

Client-side validation improves usability but does not replace backend validation. The server remains responsible for enforcing request rules, authentication, authorization, and idempotency.

## Development

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Run the configured lint checks:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Run these commands from the `client/` directory.

## Scope

The frontend focuses on the user interface and interaction with the backend API. Database operations, request validation enforcement, idempotency, and access-control decisions remain backend responsibilities.
