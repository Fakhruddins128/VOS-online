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

## 2026-09-24 — Rate limits raised and made configurable
- Users hit `Too many requests from this IP, please try again later.` during normal portal use. The global limiter in `backend/server.js` allowed only **100 requests / 15 min per IP**, which a single SPA session can exhaust (and an office behind one NAT address shares).
- Global limit default raised to **1000 requests / 15 min**; auth limit default raised from **5 to 20** attempts per 15 min (still keyed per IP + account).
- The auth limiter now sets `skipSuccessfulRequests: true`, so only **failed** login attempts count toward the limit — a user who signs in successfully is no longer pushed toward lockout.
- All four values are now configurable via optional env vars (positive integers; invalid values fall back to the defaults):
  - `RATE_LIMIT_WINDOW_MS` (default `900000`)
  - `RATE_LIMIT_MAX` (default `1000`)
  - `AUTH_RATE_LIMIT_WINDOW_MS` (default `900000`)
  - `AUTH_RATE_LIMIT_MAX` (default `20`)
  The `retryAfter` string in both limiter messages is now derived from the configured window instead of being hardcoded to `15 minutes`.
- No API contract, route, or database changes. Docs updated: `backend/README.md`.
- Verification: `node --check backend/server.js` passes; limiter behaviour smoke-tested in isolation (4 successful logins are not counted; failed logins are blocked with `429` once the max is reached).
- Note (not changed): `/api/users` still applies `authLimiter` to **every** route on that router, not just login — so non-auth calls such as vendors/change-password share the strict counter. Worth revisiting separately.

## 2026-09-19 — Dashboard Purchase Orders card shows pending counts only
- Previously the **Purchase Orders** card counted every non-draft purchase order per category via `GET /api/purchase-orders`.
- It now shows only the **pending** order count per category (`Material`, `Preps`, `Accessories`, `Packaging`, `Finish Product`) by querying `GET /api/pending-orders?vendorId=…&category=…&limit=1` and reading `pagination.totalRecords` — the same count the Pending Orders page shows for that category. The aggregate label changed from "total purchase orders" to "pending purchase orders".
- Category sub-cards now link to `/pending-orders` (where the pending rows live); the footer action still links to `/purchase-orders`.
- No backend/API changes. Docs updated: `BUSINESS_RULES.md`.
- Verification: frontend `npm run build` passes; `npm run lint` reports only the established pre-existing issues.

## 2026-09-19 — Pending Orders category filter (all 5 categories)
- The Pending Orders page now mirrors the Purchase Order Draft/Purchase Orders category filter with `Material`, `Preps`, `Accessories`, `Packaging`, `Finish Product` (default `Finish Product`).
- `backend/routes/pendingOrders.js` (`GET /api/pending-orders`): added the `category` query parameter. The Finish Product SQL is preserved verbatim. The four non-Finish categories query their own order master + order detail + variant detail + approved-vendor tables.
- Verified against the live `ERPOnline` DB (SQL Server 2017, database compatibility level 100) and fixed along the way:
  - Accessories tables are plural in the real schema; the old singular names (`AccessoryVariantDetail`, `ApprovedVendorAccessory`, `AccessoryOrderMaster`, `AccessoryOrderDetail`) did not exist, so Accessories was broken end-to-end (draft, purchase orders, pending). Corrected all three route files to `Accessories*`/`ApprovedVendorAccessories`.
  - Non-FP order-detail tables have no `AutoClosedPenaltyQty`, `DeliveryDate`, `FinalDeliveryDate`, or `CalculatedPrice`, so for those categories Pending = `OrderQty - RcvdQty`, delivery/final/closing-days are `NULL`, and `Price = FOBPrice × ExRate × remaining qty`.
  - `FOBPrice`/`ExRate` are `nvarchar(50)`: read via `TRY_CAST` (compat level 100 rejects `TRY_CONVERT`).
  - Stock is only available on `AccessoriesVariantDetail`/`PackagingVariantDetail`.`T_Stock` and `ApprovedVendorMaterial`.`InHand`; Material uses `AV.InHand`, Preps has no stock column (`NULL`).
- `frontend/src/pages/PendingOrders.jsx` + `PendingOrders.css`: category radio group (default `Finish Product`), `category` passed to the API, category change resets search + pagination, print/summary include the selected category.
- Docs updated: `API_DOCUMENTATION.md`, `BUSINESS_RULES.md`, `DATABASE.md`.
- Verification (all against live DB): `/api/pending-orders` returns 200 for all 5 categories with correct pagination + row shape; `/api/purchase-order-draft` and `/api/purchase-orders` Accessories/Packaging return 200 with data after the table-name fix; backend `node --check` passes; frontend `npm run build` passes; `npm run lint` reports only the established pre-existing issues.

## 2026-09-19 — Dashboard: Purchase Orders card replaces Profile Information
- `frontend/src/pages/Dashboard.jsx`: removed the static Profile Information card; the dashboard now leads with a **Purchase Orders** card showing a total plus one count card per category (`Material`, `Preps`, `Accessories`, `Packaging`, `Finish Product`), fetched from `GET /api/purchase-orders` and linking to `/purchase-orders`.
- The dashboard now has three count cards: Purchase Orders, Pending Orders (by `Category`), Purchase Order Draft (by category).
- Verification: frontend `npm run build` passes; `npm run lint` reports only pre-existing issues.

## 2026-09-19 — Dashboard pending order counts by category
- The dashboard previously showed a single total pending-order count.
- Added `GET /api/pending-orders/counts` (`backend/routes/pendingOrders.js`): returns pending totals grouped by `Category` (`C2.Description`) using the same two pending conditions and exclusions as the main pending-orders query.
- `frontend/src/pages/Dashboard.jsx`: the Pending Orders card now shows a total plus one count card per category, each linking to `/pending-orders`.
- Renamed the shared stat-card CSS (`Dashboard.css`) from `draft-summary`/`draft-category-*` to generic `stat-summary`/`stat-card-*` since both the pending and draft cards use them.
- Docs updated: `API_DOCUMENTATION.md`, `BUSINESS_RULES.md`.
- Verification: backend `node --check` passes; frontend `npm run build` passes; `npm run lint` reports only pre-existing issues.

## 2026-09-19 — Purchase Orders page (new) + Finish Product default
- Added a new **Purchase Orders** page and API that provides purchase orders (non-draft) with the same category filter as Purchase Order Draft:
  - `backend/routes/purchaseOrders.js`, mounted at `GET /api/purchase-orders`. Mirrors the draft route's five category queries (`Material`, `Preps`, `Accessories`, `Packaging`, `Finish Product`) but selects `OM.OrderStat != 'Draft'`.
  - `frontend/src/pages/PurchaseOrders.jsx` + `PurchaseOrders.css` (reuses the Draft page layout via `@import`), with refresh/print, image modal, and vendor-scoped fetching; routes at `/purchase-orders` in `App.jsx` and added to the Sidebar.
  - `frontend/src/components/Icon.jsx`: added the `shoppingCart` icon used by the new sidebar item.
- Default selected category is now **Finish Product** on both the new Purchase Orders page and the existing Purchase Order Draft page (`PurchaseOrderDraft.jsx` default changed from `Material`).
- Docs updated: `API_DOCUMENTATION.md`, `BUSINESS_RULES.md`, `ARCHITECTURE.md`, `PROJECT_CONTEXT.md`.
- Verification: backend `node --check` passes; frontend `npm run build` passes; `npm run lint` reports only pre-existing issues (AuthContext fast-refresh error + the established hook-dep warnings, now including `PurchaseOrders.jsx` mirroring `PurchaseOrderDraft.jsx`).

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
