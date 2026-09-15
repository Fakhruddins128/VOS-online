# CHANGELOG.md — VOS Online

## Current baseline
The supplied repository is at:
`702ef20 Update server.js`

Branch state reported by the supplied Git repository:
`master` aligned with `origin/master`.

## Recent historical commits
- `702ef20` — Update server.js
- `6f69706` — update git
- `aa47a50` — Env
- `8ea8d49` — Add production environment variables to old.env
- `fa1855b` — Delete frontend/.env
- `412f14f` — Create old.env with server and database settings
- `da74fc5` — Delete backend/.env
- `8664008` — Change FRONTEND_URL to production address
- `eb9192c` — Error
- `d7b8b0e` — update Development and User Guide
- `0dd6cd1` — forget Password
- `711501b` — Project Cleanup
- `e059448` — 404 error Handling
- `b600fc9` — update dashboard header
- `58d3a5d` — Update login and dashboard

## Migration baseline
These files were generated after inspecting the supplied project and should be considered an OpenCode handover baseline, not a claim that every historical requirement is known.

## Known technical issues/inconsistencies identified during handover
1. Frontend `api.js` exposes generic user CRUD/product endpoints that are not mounted in the current backend.
2. Frontend token interceptor expects `localStorage.token`, but login currently persists vendor data through `AuthContext` rather than a JWT/token.
3. Some pages use native `fetch` while `api.js` provides Axios helpers.
4. `backend/sql/schema.sql` is much smaller than the production/reporting schema referenced by route SQL.
5. `GET /api/users/vendors` is described in source as a debugging endpoint and should be reviewed before production exposure.
6. Password reset currently emails a temporary password rather than using a one-time reset token.
7. The supplied repository contains `.env` files and Git history with environment-related commits. Treat any real credentials as compromised if they were ever committed/shared and rotate them.

## OpenCode rule
Append a dated entry here for every meaningful future change, including:
- feature changes
- bug fixes
- API changes
- database changes
- security changes
- deployment/configuration changes
