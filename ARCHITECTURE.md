# ARCHITECTURE.md — VOS Online

## High-level architecture

Browser
  |
  v
React/Vite frontend
  |
  | HTTP GET/POST
  v
Node.js + Express backend
  |
  | parameterized SQL through mssql
  v
Microsoft SQL Server

Email path:
Backend -> Nodemailer -> configured SMTP/email service

## Frontend structure

- `frontend/src/main.jsx` — application entry point
- `frontend/src/App.jsx` — router and application shell
- `frontend/src/contexts/AuthContext.jsx` — authentication/user state
- `frontend/src/services/api.js` — Axios API client plus API helper objects
- `frontend/src/components/` — Login, Navbar, Sidebar
- `frontend/src/pages/` — Home, Dashboard, PendingOrders, PurchaseOrderDraft, ChangePassword, ForgotPassword
- `frontend/src/styles/dynamics-theme.css`, `App.css`, and page/component CSS — UI styling
- `frontend/src/assets/` — static assets

`App.jsx` currently routes:
- `/`
- `/login`
- `/forgot-password`
- `/dashboard`
- `/pending-orders`
- `/purchase-order-draft`
- `/change-password`
- catch-all -> `/login`

Sidebar is hidden on `/`, `/login`, and `/forgot-password`.

## Authentication architecture
`AuthContext`:
- reads `localStorage.user` on startup
- sets `user` and `isAuthenticated`
- login writes the user object to `localStorage`
- logout removes it

Important: route protection is not centralized in `App.jsx`; individual pages such as Purchase Order Draft perform authentication checks. Review before adding new protected pages.

## API client architecture
`frontend/src/services/api.js` creates an Axios instance:
- base URL: `${VITE_API_BASE_URL || http://localhost:5000}/api`
- timeout: 10 seconds
- JSON content type
- request interceptor attempts to add `Bearer` token from `localStorage.token`
- response interceptor unwraps `response.data`
- 401/404 handling redirects to `/login` with a special exception for change-password

Some page code also uses native `fetch` directly instead of the shared Axios client. Do not assume all requests go through `api.js`.

## Backend architecture
`backend/server.js`:
- loads environment variables
- configures Helmet, CORS, rate limiting, Morgan (development)
- enables JSON/urlencoded bodies
- mounts route modules
- exposes root and health endpoints
- exposes `/api/db-test` only outside production
- has 404 and global error middleware
- handles graceful shutdown

Route modules:
- `routes/users.js`
- `routes/pendingOrders.js`
- `routes/purchaseOrderDraft.js`

## Database architecture
`backend/config/database.js` provides a small wrapper around `mssql`.
- lazy connection
- shared connection pool
- `query(queryString, params)` binds named parameters through `request.input`
- connection settings come from environment variables

## Security middleware
- Helmet
- CORS allow-list
- global rate limit: 100 requests / 15 minutes / IP
- authentication rate limit: 5 requests / 15 minutes / IP
- express-validator utilities exist
- production error handling avoids returning unknown error details

## Known architectural inconsistencies
1. Frontend API helpers contain generic `/users` CRUD and `/products` endpoints not mounted by the current backend.
2. Axios interceptor expects `localStorage.token`, while current login stores vendor data but no token.
3. Several pages use direct `fetch` instead of the shared Axios client.
4. Authentication is localStorage-based and should be reviewed before adding sensitive capabilities.
5. Local `schema.sql` is not the full schema used by reporting SQL.
6. Existing SQL uses legacy comma-join syntax in complex reporting queries. Do not rewrite it casually because behavior must be preserved.
