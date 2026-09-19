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

## 2026-09-19 — Dashboard purchase order draft category counts
- `frontend/src/pages/Dashboard.jsx` previously showed a single draft count fetched only for the `Material` category (marked as the "default"), so it undercounted drafts in other categories.
- The Purchase Order Draft card now fetches the draft count for all 5 categories (`Material`, `Preps`, `Accessories`, `Packaging`, `Finish Product`) in parallel via `GET /api/purchase-order-draft` (`encodeURIComponent` is used for `Finish Product`).
- Each category count is shown in its own sub-card (`draft-category-card`) with the total draft count above; each sub-card and the footer button link to `/purchase-order-draft`.
- No backend/API changes were required — the endpoint already returned `count` for all categories.
- Added `Dashboard.css` styles for `.draft-summary`, `.draft-total`, `.draft-category-grid`, `.draft-category-card`, `.draft-category-count`, and `.draft-category-label`.
- Verification: `npm run lint` reports only pre-existing issues (`AuthContext` fast-refresh error, 2 pre-existing hook-dep warnings); `npm run build` passes.

## 2026-09-15 — Frontend accessibility pass
- Added `frontend/src/components/Icon.jsx`: an inline-SVG icon component (stroke-based, 24×24 outline family) with no new dependencies. Icons render `aria-hidden="true"` and `focusable="false"`.
- Replaced all emoji icons with the Icon component:
  - Sidebar menu (grid, clipboard-list, file-text, key), sidebar close (X), navbar login/logout (sign-in, sign-out).
  - Pending Orders and Purchase Order Draft refresh/print buttons and product-image buttons.
- Made sortable table headers keyboard-operable: headers in `PendingOrders` now are real `<button>` elements inside `<th>` with `scope="col"` and `aria-sort`.
- Added `aria-label` to icon-only image buttons and the rows-per-page select; added `scope="col"` to all remaining table headers.
- Image modals (`PendingOrders`, `PurchaseOrderDraft`): added `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape-to-close, initial focus on the close button, and focus return to the triggering button.
- Added show/hide password visibility toggles (eye/eye-off) to `Login` and `ChangePassword`, with `aria-label`/`aria-pressed`.
- Removed dead `handleLogout` in `Login.jsx` (referenced an undefined `setUser` and would have thrown).
- Added a "Skip to main content" link and `id="main-content"` on `<main>` in `App.jsx`.
- `App.css`: global `:focus-visible` rings, `.skip-link`, `.password-wrapper` / `.password-toggle` styles, and a `prefers-reduced-motion: reduce` block that limits animation/transition.
- `PendingOrders.css`: restyled `.sortable` for its new `<button>` context and added a high-contrast white `:focus-visible` ring on the gradient table header.
- Lint/build cleanup along the way (no behavior change): removed unused `user`, `navigate`, `getAvatarText`, `logout`, `useState`, and an unused `error` binding in `Navbar`, `Sidebar`, `PendingOrders`, `Dashboard`, `Home`.
- Verification: `npm run build` passes. `npm run lint` reports only pre-existing issues: `AuthContext.jsx` triggers `react-refresh/only-export-components` (structural — `useAuth` hook exported from a component file; refactor deferred as out of scope) and two `react-hooks/exhaustive-deps` warnings for the data-fetch effects in `PendingOrders` and `PurchaseOrderDraft` (pre-existing; avoiding a `useCallback` refactor of working fetch code).

### Manual test suggestions
- Keyboard: Tab through sidebar/nav, sort headers (Enter toggles sort), open image modal (focus lands on close), press Escape (focus returns to the image button).
- Password fields: eye toggle shows/hides text and announces via `aria-pressed`.
- With OS reduced-motion enabled, animations/spinners are effectively disabled.

## 2026-09-15 — Pending Orders search filter
- Added search-by text filter to the Pending Orders page, matching on **Order No.** and **Item Code** (server-side).
- `backend/routes/pendingOrders.js` (`GET /api/pending-orders`):
  - New optional `search` query param. Main query wraps the UNION result with `WHERE ([Order #] LIKE @searchPattern OR [Item Code] LIKE @searchPattern)`; count query adds `OM.OrderNo LIKE @searchPattern OR (IM.ItemCode+'-'+M.M_Code+'-'+C.Code+'-'+F.Code) LIKE @searchPattern` to both UNION parts so pagination totals stay consistent.
  - Parameterized with `%term%` — no user input is concatenated into SQL.
- `frontend/src/pages/PendingOrders.jsx`:
  - Toolbar row with a search input + search (magnifier) button and a Clear button next to the existing rows-per-page select.
  - Search applies on submit/Enter or Clear, resets to page 1, and is appended to the request only when non-empty.
- `frontend/src/components/Icon.jsx`: added the `search` (magnifier) icon.
- `frontend/src/pages/PendingOrders.css`: `.orders-toolbar`, `.search-form`, `.search-input`, `.search-btn`, `.search-clear` plus responsive stacking on small screens.
- Verification: backend `node --check` passes; stubbed-endpoint test confirms the main query filters, keeps `ORDER BY`/`OFFSET` pagination, the count query filters both UNION parts, and no-search requests produce unchanged SQL. Frontend `npm run build` and `npm run lint` pass (lint: only the pre-existing `AuthContext` error + 2 hook-dep warnings).

## 2026-09-15 — Forgot Password flow fixes
- Root cause of "not working": backend `.env` had no `EMAIL_USER`/`EMAIL_PASS`, so `emailService` fell into dev-mode (logged the generated password to the server console, sent nothing) while the API still replied "New password sent to your email" — the old password was then destroyed in the DB and the vendor was locked out.
- `backend/services/emailService.js`:
  - Robust transport config: named service (`EMAIL_SERVICE`, e.g. gmail/outlook) or generic SMTP (`EMAIL_HOST`/`EMAIL_PORT`/`EMAIL_SECURE`) instead of forcing `service` + `host` simultaneously.
  - Dev fallback now returns an explicit `dev: true` + `message` instead of a misleading success, and warns clearly in the server log. No real credentials are ever logged.
  - Email failure no longer returns a fake success (`success:false` only on actual failure).
- `backend/routes/users.js` (`POST /api/users/forgot-password`):
  - Sends the password email BEFORE updating the DB so a delivery failure cannot lock the vendor out (previously DB was updated first, then the email; the vendor's working password could be destroyed and the replacement never received).
  - Generated reset password is now 12 chars and satisfies the vendor password policy (upper + lower + digit + symbol) via a new `generateRandomPassword()` helper using `crypto.randomInt`.
  - Passes `dev`/`devPassword` through to the frontend in dev mode so the temporary password is visible in the UI instead of only in server logs.
  - Generic 500 message (no internal error details leaked to the client).
- `backend/.env`: added `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE` placeholders (names only; values left empty for the owner to fill in).
- `frontend/src/pages/ForgotPassword.jsx`: shows the dev-mode temporary password in a styled box, handles non-JSON/error responses, accurate success/error messages.
- `frontend/src/components/Login.jsx` + `Login.css`: fixed the "Forgot Password?" link using the old `--primary-color` variable (undefined after the theme rewrite) → `--dynamics-primary`; added `.reset-password-box` styles.
- Verification: frontend `npm run build` and `npm run lint` pass (lint reports only the pre-existing `AuthContext` refresh error + 2 hook-dep warnings). Backend `node --check` passes. Endpoint exercised locally with the SQL Server unavailable; the route fails safely with a generic 500. Logic validated with a stubbed DB/email harness: (a) email `dev` success → 200 with policy-compliant `devPassword`, queries were `SELECT` then `UPDATE`; (b) email failure → 500 and NO `UPDATE` (password not changed).
- Note: real email delivery still requires the owner to fill `EMAIL_USER`/`EMAIL_PASS` (e.g. a Gmail app password) in `backend/.env` and for `DB_SERVER`/`DB_*` in `backend/.env` to point at a reachable SQL Server.
