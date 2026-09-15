# PROJECT_CONTEXT.md — VOS Online

## Purpose
VOS Online is a vendor portal used to let vendors authenticate and view operational purchasing/order information.

## Current implemented frontend features
- Login
- Dashboard
- Pending Orders
- Purchase Order Draft
- Change Password
- Forgot Password
- Sidebar/navbar layout
- Product-image modal viewing
- Printing of Pending Orders and Purchase Order Draft pages
- Pagination and sorting for Pending Orders
- Purchase Order Draft category selection

## Frontend
- React 19
- React Router DOM 7
- Vite
- Axios
- Plain JSX/CSS (no Redux detected)
- Authentication state is held in `AuthContext`
- User information is persisted in browser `localStorage` under `user`
- API base URL is read from `VITE_API_BASE_URL`, defaulting to `http://localhost:5000`

## Backend
- Node.js / Express 5
- Microsoft SQL Server via `mssql`
- dotenv
- CORS
- Helmet
- Morgan (development logging)
- express-rate-limit
- express-validator
- Nodemailer

## Database
The application connects to an existing Microsoft SQL Server database. The application SQL references a wider existing ERP/vendor database schema, especially for purchase-order reporting. The local `backend/sql/schema.sql` defines only a minimal `Vendor` table and sample rows; it is not a complete representation of the production/reporting database.

## Authentication
Current authentication is vendor-email/password based.
- `POST /api/users/login`
- Vendor records are read from `Vendor`.
- Active status is checked.
- If `Salt` exists, PBKDF2 hashing is used; otherwise a legacy plaintext comparison is used.
- The frontend stores returned vendor data in `localStorage`.
- The frontend API interceptor checks for a `token`, but the current login implementation does not establish a token/JWT. This is a known inconsistency.
- Change-password generates a new salt and PBKDF2 hash.
- Forgot-password generates a temporary password, stores its salted hash, and attempts to email it.

## Vendor scoping
Pending Orders and Purchase Order Draft APIs require `vendorId` and use it to filter SQL data.

## Current routes
See `API_DOCUMENTATION.md`.

## Deployment
The repository contains `DEPLOYMENT_GUIDE.md`. The frontend is a Vite application and the backend is a Node/Express server. Production URLs/configuration are environment-driven. Do not copy actual environment values into documentation.

## Source-control history
Recent history includes commits for login/dashboard, 404 handling, password reset, cleanup, deployment/environment changes, and server updates. See `CHANGELOG.md`.

## Important migration note
This project was developed with AI tooling before OpenCode. OpenCode should treat the checked-in source code as the authoritative current implementation and use these documents as a map, not as permission to redesign the application.
